import React, { useState, useEffect } from 'react';
import { Goal } from './types';
import { resizeImage, getTodayDateString, getYesterdayDateString, isToday } from './utils';
import AddGoalForm from './components/AddGoalForm';
import GoalCard from './components/GoalCard';
import ProgressModal from './components/ProgressModal';
import { Target, Trophy, Flame, X } from 'lucide-react';

const App: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('goalQuestData');
    if (saved) {
      try {
        setGoals(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse goals", e);
      }
    }
    setLoading(false);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem('goalQuestData', JSON.stringify(goals));
      } catch (e) {
        alert("Storage limit reached! Please delete some photos or goals.");
      }
    }
  }, [goals, loading]);

  // Check for daily notification
  useEffect(() => {
    if (loading) return;

    const today = getTodayDateString();
    const lastNotified = localStorage.getItem('lastNotificationDate');

    if (lastNotified !== today && goals.length > 0) {
      // Find a goal not completed today to remind the user about
      const incompleteGoal = goals.find(g => g.lastCompletedDate !== today);
      
      if (incompleteGoal) {
        setNotification(`Don't forget ${incompleteGoal.title}! Keep your streak alive 🔥`);
        localStorage.setItem('lastNotificationDate', today);
      }
    }
  }, [loading, goals]);

  const addGoal = (title: string, description: string) => {
    const newGoal: Goal = {
      id: crypto.randomUUID(),
      title,
      description,
      createdAt: new Date().toISOString(),
      streak: 0,
      lastCompletedDate: null,
      photos: []
    };
    setGoals(prev => [newGoal, ...prev]);
  };

  const deleteGoal = (id: string) => {
    if (window.confirm("Are you sure you want to delete this goal? This cannot be undone.")) {
      setGoals(prev => prev.filter(g => g.id !== id));
    }
  };

  const toggleGoal = (id: string) => {
    setGoals(prev => prev.map(goal => {
      if (goal.id !== id) return goal;

      const today = getTodayDateString();
      const yesterday = getYesterdayDateString();
      
      // If already completed today, toggle off
      if (goal.lastCompletedDate === today) {
        return {
          ...goal,
          lastCompletedDate: null, // "Uncheck"
          streak: Math.max(0, goal.streak - 1)
        };
      }

      // If completing today
      let newStreak = goal.streak;
      
      if (goal.lastCompletedDate === yesterday) {
        // Perfect streak continuation
        newStreak += 1;
      } else if (goal.lastCompletedDate === today) {
        // Should catch above, but safety
        newStreak = goal.streak;
      } else {
        // Streak broken or new goal
        newStreak = 1;
      }

      return {
        ...goal,
        lastCompletedDate: today,
        streak: newStreak
      };
    }));
  };

  const addPhoto = async (id: string, file: File) => {
    try {
      const resizedBase64 = await resizeImage(file);
      setGoals(prev => prev.map(goal => {
        if (goal.id !== id) return goal;
        
        return {
          ...goal,
          photos: [
            ...goal.photos,
            {
              id: crypto.randomUUID(),
              date: new Date().toISOString(),
              dataUrl: resizedBase64
            }
          ]
        };
      }));
    } catch (error) {
      console.error("Error processing image", error);
      alert("Failed to process image. Try a smaller file.");
    }
  };

  const openProgress = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsModalOpen(true);
  };

  const activeStreaksCount = goals.filter(g => g.streak > 0).length;

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] text-gray-800 pb-20">
      
      {/* Notification Banner */}
      {notification && (
        <div className="bg-orange-500 text-white px-4 py-3 shadow-lg relative animate-in slide-in-from-top duration-500 z-50">
          <div className="container mx-auto max-w-6xl flex justify-between items-center">
            <div className="flex items-center gap-2 font-medium">
              <Flame size={20} className="fill-white animate-pulse" />
              <span>{notification}</span>
            </div>
            <button 
              onClick={() => setNotification(null)} 
              className="p-1 hover:bg-orange-600 rounded-full transition-colors"
              aria-label="Dismiss notification"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="pt-10 pb-12 px-6 text-center text-white relative">
        {/* Streak Badge - Top Right */}
        <div className="absolute top-4 right-4 md:right-8 flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm animate-in fade-in duration-1000 group hover:bg-white/20 transition-colors cursor-default" title="Total Active Streaks">
          <Flame size={18} className="fill-orange-400 text-orange-400 drop-shadow-sm" />
          <span className="font-bold text-white text-sm">{activeStreaksCount} Active Streaks</span>
        </div>

        <div className="flex items-center justify-center gap-3 mb-2 animate-in fade-in slide-in-from-top-4 duration-700">
          <Target size={40} className="text-purple-200" />
          <h1 className="text-4xl font-extrabold tracking-tight">GoalQuest</h1>
        </div>
        <p className="text-purple-100 text-lg opacity-90 max-w-md mx-auto">
          Build habits, track progress, and visualize your success.
        </p>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 max-w-6xl">
        
        <AddGoalForm onAdd={addGoal} />

        {goals.length === 0 ? (
          <div className="text-center py-20 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl mx-auto max-w-2xl animate-in zoom-in duration-500">
            <Trophy size={64} className="mx-auto text-purple-200 mb-4 opacity-50" />
            <h3 className="text-2xl font-bold text-white mb-2">No Goals Yet</h3>
            <p className="text-purple-100">Create your first goal above to start your journey!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onToggle={toggleGoal}
                onDelete={deleteGoal}
                onAddPhoto={addPhoto}
                onViewProgress={openProgress}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <ProgressModal 
        isOpen={isModalOpen}
        goal={selectedGoal}
        onClose={() => setIsModalOpen(false)}
      />
      
      {/* Footer */}
      <footer className="text-center text-purple-200 text-sm py-8 mt-8">
        <p>&copy; {new Date().getFullYear()} GoalQuest. Data saved locally.</p>
      </footer>
    </div>
  );
};

export default App;
