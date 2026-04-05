import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, User as UserIcon, Settings, Heart, Info, 
  ShieldAlert, RefreshCw, WifiOff, Trash2, Check, Plus, LogOut, Camera
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { dbService } from '../dbService';

interface ProfileViewProps {
  isDark: boolean;
  t: any;
  currentUser: any;
  setCurrentUser: (user: any) => void;
  profileSubView: string | null;
  setProfileSubView: (view: string | null) => void;
  isOffline: boolean;
  isSyncing: boolean;
  hasLoadedAtLeastOnce: boolean;
  updateShoppingList: (list: any[]) => void;
  updateSettings: (settings: any) => void;
  handleLogout: () => void;
  handleDeleteAccount: () => void;
  showAlert: (title: string, message: string) => void;
  setIsAdminDashboardOpen: (open: boolean) => void;
  getInitials: (name: string) => string;
  springTransition: any;
  securitySubView: any;
  setSecuritySubView: (view: any) => void;
  goBack: () => void;
  settings: any;
  ProfileSubViewRenderer: any; // Passed from App.tsx as it contains too many dependencies
}

const ProfileView: React.FC<ProfileViewProps> = ({
  isDark,
  t,
  currentUser,
  setCurrentUser,
  profileSubView,
  setProfileSubView,
  isOffline,
  isSyncing,
  hasLoadedAtLeastOnce,
  updateShoppingList,
  updateSettings,
  handleLogout,
  handleDeleteAccount,
  showAlert,
  setIsAdminDashboardOpen,
  getInitials,
  springTransition,
  securitySubView,
  setSecuritySubView,
  goBack,
  settings,
  ProfileSubViewRenderer
}) => {
  return (
    <div className={`flex-1 flex flex-col pb-44 relative ${isDark ? 'bg-[#000000]' : 'bg-[#f3f4f6]'}`} style={{ paddingTop: Capacitor.isNativePlatform() ? 'calc(env(safe-area-inset-top, 40px) + 16px)' : '16px' }}>
      <AnimatePresence>
        {profileSubView && (
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }} 
            transition={springTransition} 
            className={`absolute inset-0 z-50 p-6 flex flex-col ${isDark ? 'bg-[#000000]' : 'bg-white'}`} 
            style={{ paddingTop: Capacitor.isNativePlatform() ? 'calc(env(safe-area-inset-top, 40px) + 24px)' : '24px' }}
          >
            <header className="flex items-center justify-between mb-8 shrink-0">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setProfileSubView(null)} 
                  className={`p-2 rounded-full transition-all active:scale-90 ${isDark ? 'bg-white/10 text-white' : 'bg-stone-50 text-stone-600'}`}
                >
                  <ChevronLeft size={22} strokeWidth={2.5} />
                </button>
                <h2 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-stone-800'}`}>
                  {profileSubView === 'personalInfo' ? t.personalInfo :
                    profileSubView === 'security' ? t.security :
                      profileSubView === 'notifications' ? t.notifications :
                        profileSubView === 'shopping' ? "Ma liste de courses" :
                          profileSubView === 'about' ? t.about :
                            profileSubView === 'contribution' ? t.contribution :
                              t.settings}
                </h2>
              </div>
              {isOffline && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-rose-500 shrink-0">
                  <WifiOff size={20} />
                </motion.div>
              )}
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
              {profileSubView === 'shopping' ? (
                <div className="space-y-6">
                  {currentUser?.shoppingList && currentUser.shoppingList.length > 0 ? (
                    <div className="space-y-3">
                      {currentUser.shoppingList.map((shopItem: any) => (
                        <motion.div
                          key={shopItem.id}
                          layout
                          className={`p-4 rounded-[28px] border transition-all flex items-center gap-4 ${shopItem.isPurchased ? (isDark ? 'bg-emerald-900/20 border-emerald-500/20 opacity-70' : 'bg-emerald-50 border-emerald-100 opacity-70') : (isDark ? 'bg-white/5 border-white/5 shadow-black/40' : 'bg-white border-stone-100 shadow-sm')}`}
                        >
                          <button
                            onClick={() => {
                              const newList = currentUser.shoppingList.map((i: any) =>
                                i.id === shopItem.id ? { ...i, isPurchased: !i.isPurchased } : i
                              );
                              updateShoppingList(newList);
                            }}
                            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${shopItem.isPurchased ? 'bg-emerald-500 scale-110' : (isDark ? 'bg-white/10 border-2 border-white/10' : 'bg-stone-50 border-2 border-stone-200')}`}
                          >
                            {shopItem.isPurchased && <Check size={16} strokeWidth={3} className="text-white" />}
                          </button>
                          <div className="flex-1">
                            <p className={`text-[14px] font-bold leading-none mb-1 transition-all ${shopItem.isPurchased ? (isDark ? 'text-emerald-400/60 line-through' : 'text-emerald-900 line-through') : (isDark ? 'text-white' : 'text-stone-800')}`}>{shopItem.item}</p>
                            <p className={`text-[11px] font-black tracking-tight ${shopItem.isPurchased ? 'text-emerald-600/60' : 'text-[#fb5607]'}`}>{shopItem.amount}</p>
                            {shopItem.recipeName && (
                              <p className={`text-[9px] font-black uppercase tracking-[0.1em] mt-1 ${isDark ? 'text-white/20' : 'text-stone-300'}`}>{shopItem.recipeName}</p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              const newList = currentUser.shoppingList.filter((i: any) => i.id !== shopItem.id);
                              updateShoppingList(newList);
                            }}
                            className={`p-2 transition-colors ${isDark ? 'text-white/20 hover:text-rose-500' : 'text-stone-300 hover:text-rose-500'}`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </motion.div>
                      ))}

                      <button
                        onClick={() => {
                          updateShoppingList([]);
                        }}
                        className="w-full py-6 rounded-[28px] border-2 border-dashed border-stone-200/20 text-rose-500 font-black text-[11px] uppercase tracking-[0.2em] mt-6 active:scale-95 transition-all"
                      >
                        Vider la liste de courses
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className={`w-28 h-28 rounded-[40px] flex items-center justify-center mb-8 relative ${isDark ? 'bg-white/5' : 'bg-amber-50'}`}>
                        <span className="text-5xl drop-shadow-xl">🛒</span>
                        <div className="absolute -top-2 -right-2 w-10 h-10 bg-[#fb5607] rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30">
                          <Plus size={20} className="text-white" strokeWidth={3} />
                        </div>
                      </div>
                      <h3 className={`text-xl font-black mb-3 tracking-tight ${isDark ? 'text-white' : 'text-stone-800'}`}>Liste vide</h3>
                      <p className={`text-sm max-w-[240px] leading-relaxed font-medium ${isDark ? 'text-white/40' : 'text-stone-400'}`}>
                        Ajoutez des ingrédients depuis les fiches de recettes pour préparer vos prochaines courses !
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <ProfileSubViewRenderer
                  profileSubView={profileSubView}
                  setProfileSubView={setProfileSubView}
                  currentUser={currentUser}
                  setCurrentUser={setCurrentUser}
                  t={t}
                  securitySubView={securitySubView}
                  setSecuritySubView={setSecuritySubView}
                  goBack={goBack}
                  updateSettings={updateSettings}
                  handleLogout={handleLogout}
                  settings={settings}
                  isSyncing={isSyncing}
                  hasLoadedAtLeastOnce={hasLoadedAtLeastOnce}
                  showAlert={showAlert}
                  handleDeleteAccount={handleDeleteAccount}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col items-center py-12 px-6">
        <div className={`relative group mb-6`}>
            <div className={`w-32 h-32 rounded-[48px] border-4 p-1 shadow-2xl transition-transform duration-500 group-hover:rotate-6 ${isDark ? 'border-white/10 bg-[#111]' : 'border-white bg-white'}`}>
                <div className={`w-full h-full rounded-[40px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-orange-500 to-[#ff4800]`}>
                    <span className="text-4xl font-black text-white tracking-tight drop-shadow-lg">
                        {getInitials(currentUser?.name)}
                    </span>
                </div>
            </div>
            <button className="absolute -bottom-2 -right-2 w-11 h-11 bg-[#fb5607] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 border-2 border-black active:scale-90 transition-all">
                <Camera size={20} strokeWidth={2.5} />
            </button>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-3 mb-2">
            <h2 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>{currentUser?.name}</h2>
            {currentUser?.is_admin && (
                <div className="bg-[#fb5607] text-[9px] text-white px-3 py-1 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 flex items-center gap-1.5 active:scale-95 transition-all">
                <ShieldAlert size={12} strokeWidth={3} /> ADMIN
                </div>
            )}
          </div>
          <p className={`text-[14px] font-bold tracking-tight ${isDark ? 'text-white/40' : 'text-stone-500'}`}>{currentUser?.email}</p>
        </div>

        {/* Cloud Connection Status + Refresh */}
        <div className="mt-8 flex items-center gap-3">
          <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border backdrop-blur-xl ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-stone-100 shadow-sm shadow-stone-200/50'}`}>
            <div className={`w-3 h-3 rounded-full ${dbService.supabase ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse' : 'bg-rose-500'}`} />
            <span className={`text-[11px] font-black uppercase tracking-[0.15em] ${isDark ? 'text-white/40' : 'text-stone-500'}`}>
              Cloud Sync: {dbService.supabase ? 'Activé' : 'Désactivé'}
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => window.location.reload()}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-stone-100 shadow-sm shadow-stone-200/50'} ${isSyncing ? 'text-[#ff4800]' : (isDark ? 'text-white/40' : 'text-stone-400')}`}
          >
            <motion.div
              animate={isSyncing ? { rotate: 360 } : { rotate: 0 }}
              transition={isSyncing ? { repeat: Infinity, duration: 1.5, ease: 'linear' } : { duration: 0.3 }}
            >
              <RefreshCw size={20} strokeWidth={2.5} />
            </motion.div>
          </motion.button>
        </div>
      </header>

      <section className="px-6 space-y-4">
        {[
          { icon: <UserIcon size={22} />, label: t.personalInfo, action: () => setProfileSubView('personalInfo'), color: 'bg-blue-500/10 text-blue-500' },
          { icon: <Settings size={22} />, label: t.settings, action: () => setProfileSubView('settings'), color: 'bg-stone-500/10 text-stone-500' },
          { icon: <Heart size={22} />, label: t.contribution, action: () => setProfileSubView('contribution'), color: 'bg-rose-500/10 text-rose-500' },
          { icon: <Info size={22} />, label: t.about, action: () => setProfileSubView('about'), color: 'bg-amber-500/10 text-amber-500' },
        ].map((item, idx) => (
            <motion.button 
                key={idx}
                whileTap={{ scale: 0.98 }}
                onClick={item.action} 
                className={`w-full flex items-center justify-between p-5 rounded-[32px] border transition-all ${isDark ? 'bg-[#0d0d0d] border-white/5 hover:bg-white/5 shadow-lg shadow-black/40' : 'bg-white border-stone-100/50 hover:bg-stone-50 shadow-sm'}`}
            >
                <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/5 text-white/50' : item.color}`}>
                    {item.icon}
                    </div>
                    <span className={`font-black text-[15px] tracking-tight ${isDark ? 'text-white/80' : 'text-stone-800'}`}>{item.label}</span>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-white/5 text-white/10 text-white/20' : 'bg-stone-50 text-stone-300'}`}>
                    <ChevronRight size={18} strokeWidth={3} />
                </div>
            </motion.button>
        ))}

        <motion.a 
            whileTap={{ scale: 0.98 }}
            href="https://wa.me/+2290151455072" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`w-full flex items-center justify-between p-5 rounded-[32px] border transition-all outline-none ${isDark ? 'bg-[#0d0d0d] border-[#25D366]/20' : 'bg-white border-green-100/50 hover:bg-green-50 shadow-sm'}`}
        >
          <div className="flex items-center gap-5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-[#25D366]/10 text-[#25D366]' : 'bg-[#25D366]/10 text-[#25D366]'}`}>
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <span className={`font-black text-[15px] tracking-tight ${isDark ? 'text-[#25D366]' : 'text-stone-800'}`}>Support WhatsApp</span>
          </div>
          <ChevronRight size={18} strokeWidth={3} className={isDark ? 'text-[#25D366]/40' : 'text-stone-300'} />
        </motion.a>

        {currentUser?.is_admin && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAdminDashboardOpen(true)}
            className={`w-full flex items-center justify-between p-5 rounded-[32px] border transition-all mb-4 ${isDark ? 'bg-[#fb5607]/10 border-[#fb5607]/30' : 'bg-orange-50 border-orange-100 shadow-sm'}`}
          >
            <div className="flex items-center gap-5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-[#fb5607]/20 text-[#fb5607]' : 'bg-[#fb5607] text-white shadow-lg shadow-orange-500/20'}`}>
                <ShieldAlert size={22} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col items-start">
                <span className={`font-black text-[15px] tracking-tight ${isDark ? 'text-white' : 'text-stone-800'}`}>Administration</span>
                <span className="text-[10px] font-black text-[#fb5607] uppercase tracking-[0.1em]">Community & Flux</span>
              </div>
            </div>
            <ChevronRight size={18} strokeWidth={3} className={isDark ? 'text-[#fb5607]/40' : 'text-[#fb5607]/40'} />
          </motion.button>
        )}

        <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className={`w-full flex items-center justify-between p-6 rounded-[32px] border border-rose-500/20 bg-rose-500/5 text-rose-500 active:bg-rose-500/10 transition-all font-black text-[15px] tracking-tight shadow-lg shadow-rose-500/5`}
        >
            <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-rose-500/10">
                    <LogOut size={22} strokeWidth={3} />
                </div>
                <span>Se déconnecter</span>
            </div>
            <ChevronRight size={18} strokeWidth={3} />
        </motion.button>
      </section>
    </div>
  );
};

export default ProfileView;
