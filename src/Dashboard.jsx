import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts'
import {
    Users,
    Target,
    TrendingUp,
    CheckCircle,
    MessageCircle,
    Clock,
    LogOut
} from 'lucide-react'
import './dashboard.css'

const Dashboard = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalVisits: 0,
        totalLeads: 0,
        conversionRate: 0,
        whatsAppSent: 0
    })
    const [funnelData, setFunnelData] = useState([])
    const [recentLeads, setRecentLeads] = useState([])

    // Hardcoded credentials as requested
    const ADMIN_USER = 'admin'
    const ADMIN_PASS = 'admin123'

    useEffect(() => {
        const sessionAuth = sessionStorage.getItem('dash_auth')
        if (sessionAuth === 'true') {
            setIsAuthenticated(true)
            fetchDashboardData()
        } else {
            setLoading(false)
        }
    }, [])

    const handleLogin = (e) => {
        e.preventDefault()
        // Trim inputs to avoid accidental spaces
        if (username.trim() === ADMIN_USER && password.trim() === ADMIN_PASS) {
            setIsAuthenticated(true)
            sessionStorage.setItem('dash_auth', 'true')
            fetchDashboardData()
        } else {
            setError('Credenciais inválidas. Tente admin / admin123')
            console.log('Login falhou:', { u: username, p: password })
        }
    }

    const handleLogout = () => {
        setIsAuthenticated(false)
        sessionStorage.removeItem('dash_auth')
    }

    const fetchDashboardData = async () => {
        setLoading(true)
        try {
            // 1. Fetch Funnel Data (Step Counts)
            // Group by step_name or step_number manually since Supabase aggregation is limited on client
            const { data: events, error: eventsError } = await supabase
                .from('funnel_events')
                .select('step_name, step_number, session_id')

            if (eventsError) throw eventsError

            // Process funnel data
            const stepCounts = {}
            const uniqueSessions = new Set()

            events.forEach(event => {
                uniqueSessions.add(event.session_id)
                if (!stepCounts[event.step_number]) {
                    stepCounts[event.step_number] = {
                        name: event.step_name || `Etapa ${event.step_number}`,
                        count: 0,
                        step: event.step_number
                    }
                }
                stepCounts[event.step_number].count += 1
            })

            // Count unique sessions per step for better accuracy (optional, kept simple for now)
            // Actually, let's just count events for now as a proxy for "visits to step"

            const formattedFunnel = Object.values(stepCounts).sort((a, b) => a.step - b.step)
            setFunnelData(formattedFunnel)

            // 2. Fetch Leads Data (using RPC to bypass RLS safely)
            const { data: leads, error: leadsError } = await supabase
                .rpc('get_admin_leads')

            if (leadsError) throw leadsError

            setRecentLeads(leads)

            // 3. Calculate KPIs
            const totalVisits = uniqueSessions.size
            const totalLeads = leads.length // or count from DB if separate query
            const whatsAppSentCount = leads.filter(l => l.whatsapp_sent).length

            // Get total leads count from the fetched array (simplest way since we limit to 100 in RPC)
            const totalLeadsCount = leads.length

            setStats({
                totalVisits: totalVisits || 0,
                totalLeads: totalLeadsCount || 0,
                conversionRate: totalVisits ? ((totalLeadsCount / totalVisits) * 100).toFixed(1) : 0,
                whatsAppSent: whatsAppSentCount
            })

        } catch (err) {
            console.error('Error fetching dashboard data:', err)
        } finally {
            setLoading(false)
        }
    }

    if (!isAuthenticated) {
        return (
            <div className="dash-login-container">
                <div className="dash-login-card glass-card">
                    <div className="dash-brand">
                        <Users size={32} color="#3d3e91" />
                        <h1>Admin Dashboard</h1>
                    </div>
                    <form onSubmit={handleLogin}>
                        <div className="input-group">
                            <label>Usuário</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="admin"
                            />
                        </div>
                        <div className="input-group">
                            <label>Senha</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="********"
                            />
                        </div>
                        {error && <p className="error-msg">{error}</p>}
                        <button type="submit" className="btn-dash-primary">Entrar</button>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="dashboard-app">
            <aside className="sidebar glass-panel">
                <div className="brand">
                    <Users size={24} />
                    <span>Admin</span>
                </div>
                <nav>
                    <a href="#" className="active"><Target size={20} /> Visão Geral</a>
                    <a href="#" onClick={handleLogout} className="logout"><LogOut size={20} /> Sair</a>
                </nav>
            </aside>

            <main className="main-content">
                <header className="top-bar glass-panel">
                    <h2>Dashboard de Conversão</h2>
                    <div className="refresh-btn">
                        <button onClick={fetchDashboardData} className="btn-icon">
                            <Clock size={18} /> Atualizar
                        </button>
                    </div>
                </header>

                <div className="kpi-grid">
                    <div className="kpi-card glass-card">
                        <div className="kpi-icon icon-blue"><Users size={24} /></div>
                        <div className="kpi-info">
                            <h3>Visitas Totais</h3>
                            <p>{stats.totalVisits}</p>
                        </div>
                    </div>
                    <div className="kpi-card glass-card">
                        <div className="kpi-icon icon-green"><CheckCircle size={24} /></div>
                        <div className="kpi-info">
                            <h3>Leads Gerados</h3>
                            <p>{stats.totalLeads}</p>
                        </div>
                    </div>
                    <div className="kpi-card glass-card">
                        <div className="kpi-icon icon-purple"><TrendingUp size={24} /></div>
                        <div className="kpi-info">
                            <h3>Taxa de Conversão</h3>
                            <p>{stats.conversionRate}%</p>
                        </div>
                    </div>
                    <div className="kpi-card glass-card">
                        <div className="kpi-icon icon-teal"><MessageCircle size={24} /></div>
                        <div className="kpi-info">
                            <h3>WhatsApp Enviado</h3>
                            <p>{stats.whatsAppSent}</p>
                        </div>
                    </div>
                </div>

                <div className="charts-grid">
                    <div className="chart-card glass-card full-width">
                        <h3>Funil de Conversão (Passo a Passo)</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={funnelData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="name" stroke="#a0aec0" />
                                    <YAxis stroke="#a0aec0" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1b4b', border: 'none', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="count" fill="#3d3e91" radius={[4, 4, 0, 0]}>
                                        {funnelData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === funnelData.length - 1 ? '#10b981' : '#3d3e91'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="leads-section glass-card">
                    <h3>Leads Recentes</h3>
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Telefone</th>
                                    <th>Data</th>
                                    <th>Status WhatsApp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLeads.map(lead => (
                                    <tr key={lead.id}>
                                        <td>{lead.name}</td>
                                        <td>{lead.phone}</td>
                                        <td>{new Date(lead.created_at).toLocaleDateString('pt-BR')} {new Date(lead.created_at).toLocaleTimeString('pt-BR')}</td>
                                        <td>
                                            <span className={`status-badge ${lead.whatsapp_sent ? 'sent' : 'pending'}`}>
                                                {lead.whatsapp_sent ? 'Enviado' : 'Pendente'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default Dashboard
