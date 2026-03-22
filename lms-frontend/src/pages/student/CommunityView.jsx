import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getMediaUrl } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const MiniCalendar = ({ events = [] }) => {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    
    // Map events by date string "YYYY-MM-DD"
    const eventsByDate = {};
    events.forEach(e => {
        const dateStr = new Date(e.event_date).toISOString().split('T')[0];
        if (!eventsByDate[dateStr]) eventsByDate[dateStr] = [];
        eventsByDate[dateStr].push(e);
    });

    const monthStr = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayIndex = currentMonth.getDay();

    const changeMonth = (offset) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
    };

    return (
        <div className="w-full relative">
            <div className="flex justify-between items-center mb-4 px-2">
                <button onClick={() => changeMonth(-1)} className="text-gray-400 hover:text-gray-600">&lt;</button>
                <div className="text-sm font-bold text-gray-700">{monthStr}</div>
                <button onClick={() => changeMonth(1)} className="text-gray-400 hover:text-gray-600">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {days.map(d => <div key={d} className="text-[10px] text-gray-400 font-bold">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {Array.from({length: firstDayIndex}).map((_, i) => <div key={`empty-${i}`}></div>)}
                {Array.from({length: daysInMonth}, (_, i) => i + 1).map(day => {
                    const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                    // Adjust for local timezone to match ISO mapping correctly
                    const isoDate = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                    const hasEvents = !!eventsByDate[isoDate];
                    const isToday = day === today.getDate() && currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear();

                    return (
                        <div 
                            key={day} 
                            title={hasEvents ? `${eventsByDate[isoDate].length} event(s)` : ''}
                            className={`py-1.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full cursor-pointer transition-colors relative
                                ${isToday ? 'bg-teal-600 text-white font-bold hover:bg-teal-700 shadow-md shadow-teal-200' : 'text-gray-700 font-medium hover:bg-gray-100'}
                                ${hasEvents && !isToday ? 'ring-2 ring-pink-400/50 text-pink-700 font-bold bg-pink-50' : ''}
                            `}
                        >
                            {day}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default function CommunityView() {
    const { id } = useParams();
    const [community, setCommunity] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Composer State
    const [newPost, setNewPost] = useState('');
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaType, setMediaType] = useState(''); // 'image', 'video', 'audio', 'article'
    const fileInputRef = useRef(null);
    
    // Interactions
    const [replyData, setReplyData] = useState({ postId: null, content: '' });
    const [activeTab, setActiveTab] = useState('Feed');
    const [openMenuPostId, setOpenMenuPostId] = useState(null);

    // Modals
    const [showEditModal, setShowEditModal] = useState(false);
    const [showEventModal, setShowEventModal] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [editData, setEditData] = useState({ name: '', description: '', cover_image: null, avatar: null, subject_id: '' });
    const [eventData, setEventData] = useState({ title: '', description: '', event_date: '' });

    const { user } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const isStaff = ['admin', 'developer', 'principal', 'teacher', 'class_teacher', 'dos', 'deputy_principal'].includes(user?.role);
    const basePath = isStaff ? '/admin' : '/student';

    useEffect(() => { fetchCommunity(); }, [id]);

    const fetchCommunity = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`communities/${id}`);
            setCommunity(res.data);
            setEditData({ 
                name: res.data.name, 
                description: res.data.description, 
                cover_image: null, 
                avatar: null,
                subject_id: res.data.subject_id || ''
            });

            // If staff, also fetch all communities list just to get subjects (or I should have a dedicated endpoint)
            // But since index returns it, let's just grab them if user is staff
            if (isStaff) {
                const listRes = await api.get('communities');
                setSubjects(listRes.data.subjects || []);
            }
        } catch (err) {
            showNotification('Failed to load community', 'error');
            navigate(`${basePath}/communities`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoin = async () => {
        try { await api.post(`communities/${id}/join`); fetchCommunity(); showNotification('Joined community', 'success'); } catch (err) { showNotification('Failed to join', 'error'); }
    };

    const handleLeave = async () => {
        try { await api.post(`communities/${id}/leave`); fetchCommunity(); showNotification('Left community', 'success'); } catch (err) { showNotification('Failed to leave', 'error'); }
    };

    const submitPost = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('content', newPost);
            if (mediaFile) {
                formData.append('media_file', mediaFile);
                formData.append('media_type', mediaType);
            }

            await api.post(`communities/${id}/posts`, formData);
            setNewPost('');
            setMediaFile(null);
            setMediaType('');
            fetchCommunity();
        } catch (err) {
            showNotification('Failed to post', 'error');
        }
    };

    const deletePost = async (postId) => {
        try {
            await api.delete(`communities/${id}/posts/${postId}`);
            showNotification('Post deleted', 'success');
            setOpenMenuPostId(null);
            fetchCommunity();
        } catch(err) {
            showNotification('Failed to delete', 'error');
        }
    };

    const submitReply = async (e) => {
        e.preventDefault();
        try {
            await api.post(`communities/${id}/posts/${replyData.postId}/replies`, { content: replyData.content });
            setReplyData({ postId: null, content: '' });
            fetchCommunity();
        } catch (err) {}
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', editData.name);
            formData.append('description', editData.description);
            formData.append('subject_id', editData.subject_id === 'null' ? '' : editData.subject_id);
            if (editData.cover_image) formData.append('cover_image', editData.cover_image);
            if (editData.avatar) formData.append('avatar', editData.avatar);

            await api.post(`communities/${id}`, formData);
            setShowEditModal(false);
            fetchCommunity();
            showNotification('Community updated', 'success');
        } catch (err) {
            showNotification('Failed to update', 'error');
        }
    };

    const submitEvent = async (e) => {
        e.preventDefault();
        try {
            await api.post(`communities/${id}/events`, eventData);
            setShowEventModal(false);
            setEventData({ title: '', description: '', event_date: '' });
            fetchCommunity();
            showNotification('Event added', 'success');
        } catch (err) {
            showNotification('Failed to add event', 'error');
        }
    };

    const triggerFileSelect = (type) => {
        setMediaType(type);
        fileInputRef.current.click();
    };

    if (isLoading && !community) return <div className="py-20 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest text-sm">Loading Community...</div>;

    const filteredPosts = activeTab === 'My Posts' ? community.posts?.filter(p => String(p.user_id) === String(user?.id)) : community.posts;

    // Fix media URLs 
    const coverUrl = community.cover_image ? getMediaUrl(community.cover_image) : null;
    const avatarUrl = community.avatar ? getMediaUrl(community.avatar) : null;

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-32 mt-4 px-4 sm:px-0">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-4 text-gray-500 cursor-pointer hover:text-blue-600 transition-colors w-max" onClick={() => navigate(`${basePath}/communities`)}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    <span className="text-xs font-black uppercase tracking-widest">Campus Hub</span>
                </div>
                {isStaff && (
                    <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)} className="text-xs uppercase px-4 rounded-lg font-bold shadow-sm">
                        Edit Appearance
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Center Column: Header & Feed */}
                <div className="lg:col-span-3 space-y-6">
                    
                    <Card noPadding className="border border-gray-100 shadow-sm bg-white overflow-visible rounded-xl">
                        <div className="h-32 sm:h-48 w-full bg-slate-800 rounded-t-xl overflow-hidden relative" style={coverUrl ? { backgroundImage: `url(${coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                             {!coverUrl && (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-900 opacity-90"></div>
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 hidden md:block"></div>
                                </>
                             )}
                             
                             <div className="absolute top-4 right-4 z-10 hidden sm:block">
                                {!community.is_member ? (
                                    <Button size="sm" onClick={handleJoin} className="bg-white text-gray-900 hover:bg-gray-100 font-bold shadow-lg text-xs tracking-wide">Join Community</Button>
                                ) : (
                                    <button onClick={handleLeave} className="px-4 py-2 bg-black/40 hover:bg-black/60 text-white backdrop-blur-md rounded-lg text-xs font-bold transition-colors border border-white/20 shadow-lg">Joined</button>
                                )}
                             </div>
                        </div>

                        <div className="px-6 sm:px-8 relative pb-4">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border-4 border-white shadow-md absolute -top-10 sm:-top-12 flex items-center justify-center font-bold text-3xl text-indigo-600 truncate overflow-hidden bg-gradient-to-br from-indigo-50 to-blue-50">
                                {avatarUrl ? <img src={avatarUrl} alt="logo" className="w-full h-full object-cover" /> : community.name.charAt(0).toUpperCase()}
                            </div>

                            <div className="pt-14 sm:pt-16 flex justify-between items-end">
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight tracking-tight">{community.name}</h1>
                                    <p className="text-sm font-medium text-gray-500 mt-1">
                                        {community.members_count.toLocaleString()} members
                                        {community.subject_id && (
                                            <span className="ml-2 text-[9px] font-black uppercase text-pink-500 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100">
                                                {community.subject?.name} Only
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div className="sm:hidden -mt-4 mb-2">
                                     {!community.is_member ? (
                                        <Button size="sm" onClick={handleJoin} className="text-xs">Join</Button>
                                     ) : (
                                        <Button size="sm" variant="outline" onClick={handleLeave} className="text-xs">Leave</Button>
                                     )}
                                </div>
                            </div>

                            <div className="flex items-center gap-6 mt-6 border-b border-gray-100">
                                <button className={`py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'Feed' ? 'border-pink-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('Feed')}>
                                    Feed
                                </button>
                                <button className={`py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'My Posts' ? 'border-pink-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('My Posts')}>
                                    My Posts
                                </button>
                            </div>
                        </div>
                    </Card>

                    {community.is_member ? (
                        <Card noPadding className="border border-gray-100 shadow-sm bg-white rounded-xl">
                            <form onSubmit={submitPost}>
                                <div className="p-4 sm:p-5 border-b border-gray-50">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden shadow-inner">
                                           {user?.avatar ? <img src={getMediaUrl(user.avatar)} className="w-full h-full object-cover" alt="Me" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">{user?.name?.charAt(0)}</div>}
                                        </div>
                                        <div className="flex-1">
                                            <textarea required rows="2" placeholder="Share your thoughts..." className="w-full bg-transparent outline-none resize-none text-sm text-gray-800 pt-2 placeholder:text-gray-400 font-medium" value={newPost} onChange={e => setNewPost(e.target.value)} />
                                            {mediaFile && (
                                                <div className="mt-2 text-xs font-bold text-gray-600 bg-gray-100 p-2 rounded-lg inline-flex items-center gap-2">
                                                    Attached: {mediaFile.name} 
                                                    <span className="text-red-500 cursor-pointer hover:underline" onClick={() => setMediaFile(null)}>Remove</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="px-4 py-3 flex flex-wrap sm:flex-nowrap justify-between items-center bg-gray-50/70 rounded-b-xl gap-2">
                                    <div className="flex items-center gap-2 sm:gap-6 flex-wrap">
                                        <input type="file" ref={fileInputRef} className="hidden" 
                                            accept={mediaType === 'image' ? "image/*" : mediaType === 'video' ? "video/*" : "audio/*"} 
                                            onChange={(e) => setMediaFile(e.target.files[0])} 
                                        />
                                        <button type="button" onClick={() => triggerFileSelect('image')} className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-orange-500 hover:bg-orange-50 px-2 py-1.5 rounded-md transition-colors">
                                            <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z"></path></svg>
                                            <span className="hidden sm:inline">Image</span>
                                        </button>
                                        <button type="button" onClick={() => triggerFileSelect('video')} className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-blue-500 hover:bg-blue-50 px-2 py-1.5 rounded-md transition-colors">
                                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                            <span className="hidden sm:inline">Video</span>
                                        </button>
                                        <button type="button" onClick={() => triggerFileSelect('audio')} className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-teal-500 hover:bg-teal-50 px-2 py-1.5 rounded-md transition-colors">
                                           <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                                           <span className="hidden sm:inline">Audio</span>
                                        </button>
                                    </div>
                                    <Button size="sm" type="submit" disabled={!newPost.trim() && !mediaFile} className="text-xs px-6 py-1.5 rounded-full shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none font-bold">Post</Button>
                                </div>
                            </form>
                        </Card>
                    ) : (
                        <Card className="p-6 text-center shadow-sm border border-gray-100 bg-gray-50 rounded-xl">
                            <p className="text-gray-500 font-bold text-sm">Join the community to participate in discussions.</p>
                        </Card>
                    )}

                    <div className="space-y-4">
                        {filteredPosts?.map(post => (
                            <Card key={post.id} className="p-5 border border-gray-100 shadow-sm bg-white rounded-xl relative">
                                {/* Post Menu (...) */}
                                {(post.user_id === user?.id || isStaff) && (
                                    <div className="absolute top-5 right-5">
                                        <button onClick={() => setOpenMenuPostId(openMenuPostId === post.id ? null : post.id)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                                        </button>
                                        {openMenuPostId === post.id && (
                                            <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20">
                                                <button onClick={() => deletePost(post.id)} className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50">Delete Post</button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 shadow-sm flex items-center justify-center font-bold text-indigo-600 overflow-hidden shrink-0">
                                        {post.user?.avatar ? <img src={getMediaUrl(post.user.avatar)} alt="avatar" className="w-full h-full object-cover"/> : post.user?.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-extrabold text-gray-900 text-sm tracking-tight">{post.user?.name}</p>
                                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mt-0.5">{new Date(post.created_at).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}</p>
                                    </div>
                                </div>

                                <p className="text-sm font-medium text-gray-800 whitespace-pre-wrap leading-relaxed mb-4 p-1">{post.content}</p>
                                
                                {/* Media Attachment Rendering */}
                                {post.media_url && (
                                    <div className="mb-4 overflow-hidden rounded-xl border border-gray-100 shadow-sm">
                                        {post.media_type === 'image' && <img src={getMediaUrl(post.media_url)} alt="post media" className="w-full h-auto max-h-[400px] object-cover" />}
                                        {post.media_type === 'video' && <video src={getMediaUrl(post.media_url)} controls className="w-full h-auto max-h-[400px] bg-black" />}
                                        {post.media_type === 'audio' && <audio src={getMediaUrl(post.media_url)} controls className="w-full mt-2" />}
                                    </div>
                                )}
                                
                                <div className="flex justify-start items-center border-t border-gray-50 pt-3">
                                     <button 
                                        className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-blue-50"
                                        onClick={() => setReplyData(prev => prev.postId === post.id ? { postId: null, content: '' } : { postId: post.id, content: '' })}
                                     >
                                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
                                         Reply {post.replies?.length > 0 && <span className="text-gray-400 font-bold ml-1">({post.replies.length})</span>}
                                     </button>
                                </div>
                                
                                {replyData.postId === post.id && (
                                    <form onSubmit={submitReply} className="mt-4 flex gap-2">
                                        <div className="w-7 h-7 mt-1 rounded-full bg-gray-100 shadow-inner overflow-hidden shrink-0 hidden sm:block">
                                           {user?.avatar ? <img src={getMediaUrl(user.avatar)} className="w-full h-full object-cover" alt="Me" /> : null}
                                        </div>
                                        <input required autoFocus type="text" placeholder="Write a reply..." className="flex-1 px-4 py-2 bg-gray-50/80 rounded-full outline-none border border-gray-100 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100/50 text-sm font-medium transition-all" value={replyData.content} onChange={e => setReplyData({...replyData, content: e.target.value})} />
                                        <Button size="sm" type="submit" disabled={!replyData.content.trim()} className="text-xs px-5 rounded-full disabled:opacity-50 font-bold">Send</Button>
                                    </form>
                                )}

                                {post.replies?.length > 0 && (
                                    <div className="mt-4 space-y-3 pl-3 sm:pl-11">
                                        {post.replies.map(reply => (
                                            <div key={reply.id} className="flex gap-2.5">
                                                 <div className="w-7 h-7 mt-0.5 rounded-full border border-gray-200 bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-sm">
                                                    {reply.user?.avatar ? <img src={getMediaUrl(reply.user.avatar)} alt="avatar" className="w-full h-full object-cover"/> : reply.user?.name.charAt(0)}
                                                </div>
                                                <div className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl p-3 pt-2.5 inline-block rounded-tl-sm">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="font-extrabold text-xs text-gray-900 tracking-tight">{reply.user?.name}</span>
                                                        <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">• {new Date(reply.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-gray-700 text-sm font-medium leading-relaxed">{reply.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        ))}
                        
                        {filteredPosts?.length === 0 && (
                             <Card className="p-10 border border-gray-100 shadow-sm bg-gray-50 text-center rounded-xl">
                                <p className="text-gray-500 font-bold text-sm">No discussions have been posted yet. Start the conversation!</p>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="lg:col-span-1 border-l border-gray-100 lg:pl-6 hidden lg:block space-y-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                       <MiniCalendar events={community.events || []} />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-4 px-1">
                            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Upcoming Events</h3>
                            {isStaff && (
                                <button onClick={() => setShowEventModal(true)} className="text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-md">
                                    + Add
                                </button>
                            )}
                        </div>
                        
                        {community.events?.length > 0 ? (
                            <div className="space-y-3">
                                {community.events.slice(0, 5).map(ev => {
                                    const eventDate = new Date(ev.event_date);
                                    return (
                                        <div key={ev.id} className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-blue-200 transition-colors group cursor-pointer">
                                            <div className="flex gap-3 items-center">
                                                <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 border border-red-100 flex flex-col items-center justify-center shrink-0 shadow-sm group-hover:bg-red-500 group-hover:text-white transition-colors">
                                                    <span className="text-[9px] font-black uppercase tracking-widest leading-none">{eventDate.toLocaleString('default', { month: 'short' })}</span>
                                                    <span className="text-base font-black leading-tight">{eventDate.getDate()}</span>
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <h4 className="text-sm font-bold text-gray-900 truncate">{ev.title}</h4>
                                                    <p className="text-xs text-gray-500 font-medium truncate">{eventDate.toLocaleString([], { timeStyle: 'short' })}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                                <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                    <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    No Events Scheduled
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="max-w-md w-full p-8 animate-in zoom-in duration-200">
                        <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase mb-6">Edit UI Assets</h2>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Name</label>
                                <input type="text" className="w-full p-3 mt-1 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Description</label>
                                <textarea rows="2" className="w-full p-3 mt-1 bg-gray-50 rounded-xl outline-none text-sm font-medium resize-none" value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Avatar Graphic</label>
                                    <input type="file" accept="image/*" onChange={e => setEditData({...editData, avatar: e.target.files[0]})} className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors cursor-pointer w-full bg-gray-50 rounded-lg p-2 border border-gray-100" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Banner Cover</label>
                                    <input type="file" accept="image/*" onChange={e => setEditData({...editData, cover_image: e.target.files[0]})} className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors cursor-pointer w-full bg-gray-50 rounded-lg p-2 border border-gray-100" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Enforce Subject Enrollment</label>
                                <select 
                                    className="w-full p-3 mt-1 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                                    value={editData.subject_id}
                                    onChange={e => setEditData({...editData, subject_id: e.target.value})}
                                >
                                    <option value="null">Public (Anyone can join)</option>
                                    {subjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">* Restricts new members to students enrolled in this subject.</p>
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} className="flex-1 text-xs font-bold uppercase tracking-widest">Cancel</Button>
                                <Button type="submit" className="flex-1 text-xs font-bold uppercase tracking-widest shadow-md">Update Design</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {showEventModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="max-w-md w-full p-8 shadow-2xl animate-in fade-in duration-200">
                        <h2 className="text-xl font-black text-gray-900 tracking-tighter uppercase mb-6">Schedule Event</h2>
                        <form onSubmit={submitEvent} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-700">Event Title</label>
                                <input required type="text" className="w-full p-3 mt-1 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-sm font-bold" value={eventData.title} onChange={e => setEventData({...eventData, title: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-700">Date & Time</label>
                                <input required type="datetime-local" className="w-full p-3 mt-1 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-sm font-medium" value={eventData.event_date} onChange={e => setEventData({...eventData, event_date: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-700">Description</label>
                                <textarea rows="2" className="w-full p-3 mt-1 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-sm font-medium resize-none" value={eventData.description} onChange={e => setEventData({...eventData, description: e.target.value})} />
                            </div>
                            <div className="flex gap-4 pt-4 border-t border-gray-100">
                                <Button type="submit" className="flex-1 text-xs font-bold uppercase tracking-widest shadow-md">Add Event</Button>
                                <Button type="button" variant="outline" onClick={() => setShowEventModal(false)} className="flex-1 text-xs font-bold uppercase tracking-widest bg-gray-50">Cancel</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
