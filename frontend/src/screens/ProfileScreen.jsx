import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useTracker } from '../context/TrackerContext';

export default function ProfileScreen({ onProfileUpdate }) {
  const { profile, updateProfile, refreshAllData } = useTracker();

  const [partnerName, setPartnerName] = useState('My Girlfriend');
  const [userName, setUserName] = useState('Partner');
  const [favoriteSnacks, setFavoriteSnacks] = useState('');
  const [favoriteDrinks, setFavoriteDrinks] = useState('');
  const [careNotes, setCareNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (profile) {
      setPartnerName(profile.partnerName || 'My Girlfriend');
      setUserName(profile.userName || 'Partner');
      const d = profile.details || {};
      setFavoriteSnacks(d.favoriteSnacks || '');
      setFavoriteDrinks(d.favoriteDrinks || '');
      setCareNotes(d.careNotes || '');
    }
  }, [profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);

      const profilePayload = {
        partnerName: partnerName.trim() || 'My Girlfriend',
        userName: userName.trim() || 'Partner',
        details: {
          favoriteSnacks: favoriteSnacks.trim(),
          favoriteDrinks: favoriteDrinks.trim(),
          careNotes: careNotes.trim()
        }
      };

      let res;
      if (updateProfile) {
        res = await updateProfile(profilePayload);
      } else {
        res = await api.updateProfile(profilePayload);
        await refreshAllData();
      }

      setMessage({ type: 'success', text: 'Couple & Girlfriend details updated! 🌸💖' });
      if (onProfileUpdate) onProfileUpdate(res?.profile || profilePayload);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto">
      {/* Top Banner Card */}
      <div className="glass-card rounded-4xl p-6 border border-primary-container/60 shadow-sm flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container text-primary text-xs font-bold mb-2">
            <span className="material-symbols-outlined text-sm">favorite</span>
            Couple & Partner Settings
          </div>
          <h2 className="text-2xl font-bold font-headline text-primary">Personal Details & Names</h2>
          <p className="text-xs text-outline font-medium">Customize your girlfriend's name & care preferences</p>
        </div>

        <div className="w-14 h-14 rounded-full bg-primary-container/80 flex items-center justify-center text-primary shadow-inner">
          <span className="material-symbols-outlined text-3xl">badge</span>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-3xl text-xs font-bold text-center ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
          }`}>
          {message.text}
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSave} className="glass-card rounded-4xl p-6 border border-primary-container/40 space-y-5">
        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-primary mb-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">female</span>
              Girlfriend's Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Maya, Sophia, Emma..."
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              className="w-full p-3 rounded-2xl bg-surface-container-low border border-primary-container/40 text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-primary mb-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">male</span>
              Your Name / Partner's Name
            </label>
            <input
              type="text"
              placeholder="e.g. Alex, Liam, Sam..."
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full p-3 rounded-2xl bg-surface-container-low border border-primary-container/40 text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Favorite Comfort Snacks */}
        <div>
          <label className="block text-xs font-bold text-primary mb-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">cookie</span>
            Favorite Comfort Snacks & Treats
          </label>
          <input
            type="text"
            placeholder="e.g. Dark chocolate, strawberries, ice cream, gummies..."
            value={favoriteSnacks}
            onChange={(e) => setFavoriteSnacks(e.target.value)}
            className="w-full p-3 rounded-2xl bg-surface-container-low border border-primary-container/40 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Favorite Comfort Drinks */}
        <div>
          <label className="block text-xs font-bold text-primary mb-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">local_cafe</span>
            Favorite Comfort Drinks & Teas
          </label>
          <input
            type="text"
            placeholder="e.g. Chamomile tea, warm ginger tea, hot cocoa..."
            value={favoriteDrinks}
            onChange={(e) => setFavoriteDrinks(e.target.value)}
            className="w-full p-3 rounded-2xl bg-surface-container-low border border-primary-container/40 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Care & Comfort Notes */}
        <div>
          <label className="block text-xs font-bold text-primary mb-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">volunteer_activism</span>
            Special Care & Comfort Notes
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Heating pad helps back cramps on day 1, loves quiet movie nights during PMS..."
            value={careNotes}
            onChange={(e) => setCareNotes(e.target.value)}
            className="w-full p-3 rounded-2xl bg-surface-container-low border border-primary-container/40 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs font-headline rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-base">save</span>
          {saving ? 'Saving Details...' : 'Save Girlfriend & Couple Details'}
        </button>
      </form>
    </div>
  );
}
