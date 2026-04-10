import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar as CalendarIcon, Filter, BarChart2, Zap, Layers, LogOut, CheckSquare, Download, Home, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RetroCard, RetroButton } from '../components/RetroUI';
import { Calendar as RetroCalendar } from '../components/retroui/Calendar';
import { format, parseISO } from 'date-fns';
import { supabase } from '../lib/supabase';

function notifyExtensionUserId(userId) {
    try {
        window.dispatchEvent(new CustomEvent('SMART_TIME_TRACKER_AUTH', {
            detail: { user_id: userId }
        }));
        return true;
    } catch (e) {
        return false;
    }
}

export default function Dashboard({ session }) {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState([]);
    const [totalTime, setTotalTime] = useState(0);
    const [chartData, setChartData] = useState([]);

    const [hourlyStats, setHourlyStats] = useState([]);

    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [showStartCalendar, setShowStartCalendar] = useState(false);
    const [showEndCalendar, setShowEndCalendar] = useState(false);

    const [isExtensionConnected, setIsExtensionConnected] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('logout') === 'true') {
            handleLogout();
            return;
        }

        const userId = session?.user?.id;
        if (!userId) return;
        document.body.setAttribute('data-smart-tracker-user-id', userId);
        const checkFlag = () => {
            if (document.documentElement.getAttribute('data-smart-tracker-installed') === 'true') {
                setIsExtensionConnected(true);
                return true;
            }
            return false;
        };
        const flagInterval = setInterval(() => {
            if (checkFlag()) dispatchAuth();
        }, 1000);
        const dispatchAuth = () => {
            try {
                window.dispatchEvent(new CustomEvent('SMART_TIME_TRACKER_AUTH', {
                    detail: { user_id: userId }
                }));
            } catch (e) {
                console.warn('Failed to dispatch auth event:', e);
            }
        };
        dispatchAuth();
        const timeout = setTimeout(() => clearInterval(flagInterval), 5000);
        return () => {
            document.body.removeAttribute('data-smart-tracker-user-id');
            clearInterval(flagInterval);
            clearTimeout(timeout);
        };
    }, [session?.user?.id]);

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 10000);
        return () => clearInterval(interval);
    }, [session, dateRange]);

    const [apiError, setApiError] = useState(null);

    const fetchLogs = async () => {
        try {
            setApiError(null);
            let url = `${import.meta.env.VITE_API_URL}/api/logs?user_id=${session?.user?.id}`;
            if (dateRange.start) url += `&start_date=${dateRange.start}`;
            if (dateRange.end) url += `&end_date=${dateRange.end}`;

            const res = await fetch(url);
            if (!res.ok) {
                const text = await res.text();
                try {
                    const json = JSON.parse(text);
                    throw new Error(json.error || json.message || "Server Error");
                } catch (e) {
                    throw new Error(text || `Server Error: ${res.status}`);
                }
            }
            const data = await res.json();
            if (Array.isArray(data)) {
                console.log("Fetched Data:", data);
                processLogs(data);
            }
        } catch (err) {
            console.error('Failed to fetch logs:', err);
            setApiError(err.message);
        }
    };

    const processLogs = (data) => {
        const grouped = {};
        let total = 0;
        const timeline = {};
        const hours = Array(24).fill(0);

        data.forEach(log => {
            const domain = log.domain;
            if (!grouped[domain]) grouped[domain] = 0;
            grouped[domain] += log.duration;
            total += log.duration;

            const date = log.created_at ? log.created_at.split('T')[0] : new Date().toISOString().split('T')[0];
            if (!timeline[date]) timeline[date] = 0;
            timeline[date] += log.duration;

            const d = new Date(log.created_at || new Date());
            const h = d.getHours();
            if (h >= 0 && h < 24) {
                hours[h] += log.duration;
            }
        });

        const sortedStats = Object.keys(grouped)
            .map(domain => ({
                app: domain,
                duration: grouped[domain],
                time: formatDuration(grouped[domain]),
                percent: total > 0 ? Math.round((grouped[domain] / total) * 100) : 0,
                color: getColor(domain)
            }))
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 5);

        const chart = Object.keys(timeline).sort().map(date => ({
            name: date,
            minutes: Math.round(timeline[date] / 60)
        }));

        const maxHour = Math.max(...hours, 1);
        const hourlyData = hours.map((seconds, h) => ({
            hour: h,
            label: h === 0 ? '12 AM' : h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`,
            seconds,
            intensity: seconds === 0 ? 0 : Math.ceil((seconds / maxHour) * 5)
        }));

        setStats(sortedStats);
        setTotalTime(total);
        setLogs(data);
        setChartData(chart);
        setHourlyStats(hourlyData);
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            navigate('/');
        } catch (error) {
            console.error("Logout error:", error);
            window.location.href = '/';
        }
    };

    const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const getColor = (domain) => {
        const colors = ['bg-retro-accent', 'bg-retro-secondary', 'bg-retro-primary'];
        return colors[domain.length % colors.length];
    };

    const handleExport = () => {
        if (!logs || logs.length === 0) return;

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Domain,Duration (Seconds),Date,Time Logged\n";

        logs.forEach(log => {
            const date = log.created_at ? log.created_at.split('T')[0] : '';
            const time = log.created_at ? new Date(log.created_at).toLocaleTimeString() : '';
            const safeDomain = log.domain.replace(/,/g, '');
            csvContent += `${safeDomain},${log.duration},${date},${time}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `smart_time_tracker_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (
        <div className="w-full max-w-5xl mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black bg-white inline-block px-2 border-2 border-retro-border shadow-retro-hover transform -rotate-1">
                        DASHBOARD
                    </h1>
                    <p className="font-bold mt-2 text-gray-600">
                        Welcome, {session?.user?.email}
                    </p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="bg-white border-2 border-black p-2 font-mono text-xs">
                        ID: {session?.user?.id.slice(0, 8)}...
                    </div>
                    <RetroButton onClick={() => navigate('/')} variant="accent" className="!py-1 !px-3 text-sm flex items-center gap-2">
                        <Home size={16} /> LANDING PAGE
                    </RetroButton>
                    <RetroButton onClick={handleLogout} className="!py-1 !px-3 text-sm">
                        <LogOut size={16} />
                    </RetroButton>
                </div>
            </div>

            {isExtensionConnected ? (
                <div className="bg-green-100 border-2 border-black p-4 mb-4 space-y-4 shadow-retro">
                    <div>
                        <strong>Extension Connected:</strong> Your session is authorized and tracking time.
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-green-500 text-white px-3 py-2 border-2 border-black font-black text-lg flex items-center gap-2">
                            <CheckSquare size={20} />
                            CONNECTED
                        </div>
                        <div className="text-xs font-bold text-green-800">
                            Updates automatically
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-yellow-100 border-2 border-black p-4 mb-4 space-y-2 shadow-retro">
                    <div>
                        <strong>Extension Not Connected:</strong> Please install the Smart Time Tracker extension.
                    </div>
                    <div className="text-sm font-bold text-gray-700">
                        Once installed, just reload this page and it should connect automatically.
                    </div>
                </div>
            )}

            {apiError && (
                <div className="bg-red-500 text-white border-2 border-black p-4 mb-8 shadow-retro animate-pulse">
                    <h3 className="font-black text-lg uppercase flex items-center gap-2">
                        <LogOut size={20} className="rotate-180" /> System Error
                    </h3>
                    <p className="font-bold font-mono mt-2">{apiError}</p>
                    <p className="text-xs mt-2 opacity-80">
                        If this says "relation does not exist", you need to run the Supabase SQL Setup.
                    </p>
                </div>
            )}

            <RetroCard>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full relative">
                        <label className="text-xs font-bold uppercase mb-1 block">Start Date</label>
                        <button
                            onClick={() => {
                                setShowStartCalendar(!showStartCalendar);
                                setShowEndCalendar(false);
                            }}
                            className="w-full bg-white border-2 border-black px-3 font-mono text-sm text-left focus:outline-none focus:shadow-retro-hover transition-all flex items-center gap-3 h-10"
                        >
                            <CalendarIcon className="w-4 h-4 text-gray-500 shrink-0" />
                            <span className="flex-1">{dateRange.start || 'Select Date'}</span>
                            {dateRange.start && (
                                <X
                                    size={14}
                                    className="cursor-pointer hover:text-red-500"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDateRange(prev => ({ ...prev, start: '' }));
                                    }}
                                />
                            )}
                        </button>
                        <AnimatePresence>
                            {showStartCalendar && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute bottom-full left-0 mb-2 z-50"
                                >
                                    <RetroCalendar
                                        mode="single"
                                        selected={dateRange.start ? parseISO(dateRange.start) : undefined}
                                        onSelect={(date) => {
                                            setDateRange(prev => ({ ...prev, start: date ? format(date, 'yyyy-MM-dd') : '' }));
                                            setShowStartCalendar(false);
                                        }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="flex-1 w-full relative">
                        <label className="text-xs font-bold uppercase mb-1 block">End Date</label>
                        <button
                            onClick={() => {
                                setShowEndCalendar(!showEndCalendar);
                                setShowStartCalendar(false);
                            }}
                            className="w-full bg-white border-2 border-black px-3 font-mono text-sm text-left focus:outline-none focus:shadow-retro-hover transition-all flex items-center gap-3 h-10"
                        >
                            <CalendarIcon className="w-4 h-4 text-gray-500 shrink-0" />
                            <span className="flex-1">{dateRange.end || 'Select Date'}</span>
                            {dateRange.end && (
                                <X
                                    size={14}
                                    className="cursor-pointer hover:text-red-500"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDateRange(prev => ({ ...prev, end: '' }));
                                    }}
                                />
                            )}
                        </button>
                        <AnimatePresence>
                            {showEndCalendar && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute bottom-full left-0 mb-2 z-50"
                                >
                                    <RetroCalendar
                                        mode="single"
                                        selected={dateRange.end ? parseISO(dateRange.end) : undefined}
                                        onSelect={(date) => {
                                            setDateRange(prev => ({ ...prev, end: date ? format(date, 'yyyy-MM-dd') : '' }));
                                            setShowEndCalendar(false);
                                        }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="flex flex-row gap-2">
                        <div className="flex flex-col">
                            <div className="h-5"></div>
                            <RetroButton
                                onClick={() => setDateRange({ start: '', end: '' })}
                                className="h-10 text-xs px-2 sm:px-4 whitespace-nowrap flex items-center gap-1"
                                disabled={!dateRange.start && !dateRange.end}
                            >
                                <Filter size={14} /> CLEAR
                            </RetroButton>
                        </div>
                        <div className="flex flex-col">
                            <div className="h-5"></div>
                            <RetroButton
                                onClick={handleExport}
                                className="h-10 text-xs px-2 sm:px-4 whitespace-nowrap !bg-retro-secondary text-white flex items-center gap-1"
                                disabled={!logs || logs.length === 0}
                            >
                                <Download size={14} /> EXPORT
                            </RetroButton>
                        </div>
                    </div>
                </div>
            </RetroCard>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <RetroCard className="md:col-span-2 space-y-6">
                    <div className="flex items-center justify-between border-b-2 border-retro-border pb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <BarChart2 /> Focus Overview
                        </h2>
                        <span className="font-mono font-bold text-2xl">{formatDuration(totalTime)}</span>
                    </div>

                    <div className="h-64 w-full border-2 border-black bg-white p-2" style={{ minHeight: '250px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData && chartData.length > 0 ? chartData : [{ name: 'Today', minutes: 0 }]}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" fontSize={10} />
                                <YAxis fontSize={10} />
                                <Tooltip />
                                <Area type="monotone" dataKey="minutes" stroke="#000" fill="#a78bfa" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-bold text-sm uppercase">Top Applications</h3>
                        {stats.length === 0 ? (
                            <div className="text-center py-8 font-bold text-gray-400">
                                No activity recorded yet.<br />Ensure the extension is connected.
                            </div>
                        ) : (
                            stats.map((item) => (
                                <div key={item.app} className="space-y-1">
                                    <div className="flex justify-between font-bold text-sm">
                                        <span>{item.app}</span>
                                        <span>{item.time}</span>
                                    </div>
                                    <div className="w-full h-8 border-2 border-retro-border bg-white relative p-1">
                                        <div
                                            className={`h-full ${item.color} border-r-2 border-retro-border`}
                                            style={{ width: `${item.percent}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </RetroCard>

                <div className="space-y-6">
                    <RetroCard className="!bg-retro-secondary text-white">
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                            <Zap /> Productivity Pulse
                        </h3>
                        <div className="text-5xl font-black mb-2">
                            {totalTime > 0 ? (Math.round((stats.length / (logs.length || 1)) * 80) + 20) + '%' : '-%'}
                        </div>
                    </RetroCard>

                    <RetroCard>
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            Peak Hours (24H)
                        </h3>
                        <div className="h-32 flex items-end justify-between gap-[2px] w-full">
                            {hourlyStats.length > 0 ? hourlyStats.map((stat) => (
                                <div key={stat.hour} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                                    <div className="hidden group-hover:block absolute bottom-full mb-1 bg-black text-white text-[10px] px-1 py-0.5 whitespace-nowrap z-20 font-mono pointer-events-none">
                                        {stat.label}: {Math.round(stat.seconds / 60)}m
                                    </div>

                                    <div
                                        className={`w-full transition-all duration-300 hover:opacity-80
                                            ${stat.intensity === 0 ? 'bg-gray-100 h-px' : ''}
                                            ${stat.intensity === 1 ? 'bg-green-200' : ''}
                                            ${stat.intensity === 2 ? 'bg-green-400' : ''}
                                            ${stat.intensity === 3 ? 'bg-green-600' : ''}
                                            ${stat.intensity >= 4 ? 'bg-black' : ''}
                                        `}
                                        style={{
                                            height: stat.intensity === 0 ? '4px' : `${Math.max(10, (stat.intensity / 5) * 100)}%`
                                        }}
                                    ></div>
                                </div>
                            )) : (
                                <div className="w-full text-center text-xs text-gray-400 self-center">No data</div>
                            )}
                        </div>
                        <div className="flex justify-between text-[10px] font-mono mt-2 text-gray-500 font-bold uppercase">
                            <span>12am</span>
                            <span>6am</span>
                            <span>12pm</span>
                            <span>6pm</span>
                        </div>
                    </RetroCard>

                    <RetroCard>
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Layers /> History
                        </h3>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto text-sm pr-2 custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-black">
                                        <th className="py-1">Site</th>
                                        <th className="py-1 text-right">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log, i) => (
                                        <tr key={i} className="border-b border-dashed border-gray-300">
                                            <td className="py-2 truncate max-w-[120px] font-bold" title={log.domain}>{log.domain}</td>
                                            <td className="py-2 text-right font-mono text-gray-600">{Math.round(log.duration)}s</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </RetroCard>
                </div>
            </div>
        </div>
    );
}
