import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, MouseEvent } from 'react'

/* eslint-disable react-hooks/set-state-in-effect */

type Task = { id: string; title: string; description?: string; priority: number; category: string; due_date?: string | null; completed: boolean; created_at: string; updated_at: string }
type User = { id: string; name: string; email: string; created_at: string }
type View = 'all' | 'pending' | 'completed'
type Theme = 'acid' | 'paper' | 'signal'
type DisplayMode = 'list' | 'grid' | 'spotlight'
type DueFilter = 'all' | 'overdue' | 'today' | 'scheduled' | 'none'
type SortMode = 'priority' | 'newest' | 'due'
type ApiRequest = <T>(path: string, options?: RequestInit) => Promise<T>

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
const themes: Theme[] = ['acid', 'paper', 'signal']
const builtInCategories = ['academic', 'personal', 'work', 'health']
type IconProps = { size?: number; className?: string; strokeWidth?: number }
const makeIcon = (glyph: string) => ({ size = 18, className = '' }: IconProps) => <span className={`ui-icon ${className}`} style={{ fontSize: size }} aria-hidden="true">{glyph}</span>
const ArrowUpRight = makeIcon('↗')
const Check = makeIcon('✓')
const Circle = makeIcon('○')
const Filter = makeIcon('≡')
const LoaderCircle = makeIcon('◌')
const LogOut = makeIcon('←')
const Menu = makeIcon('=')
const Plus = makeIcon('+')
const Search = makeIcon('/')
const Sparkles = makeIcon('*')
const Trash2 = makeIcon('×')
const X = makeIcon('×')

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('stm_token'))
  const [user, setUser] = useState<User | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [view, setView] = useState<View>('all')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('stm_theme') as Theme) || 'acid')
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => (localStorage.getItem('stm_display') as DisplayMode) || 'list')
  const [showFilters, setShowFilters] = useState(false)
  const [priority, setPriority] = useState('all')
  const [dueFilter, setDueFilter] = useState<DueFilter>('all')
  const [sortMode, setSortMode] = useState<SortMode>('priority')
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogout = () => { localStorage.removeItem('stm_token'); setToken(null); setUser(null); setTasks([]); setCustomCategories([]) }
  const request = async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
    const response = await fetch(`${API_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } })
    if (!response.ok) throw new Error((await response.json().catch(() => null))?.detail || 'Something went wrong')
    return response.status === 204 ? null as T : response.json() as Promise<T>
  }
  const loadTasks = async () => {
    if (!token) return
    setLoading(true)
    try { const params = new URLSearchParams(); if (search.trim()) params.set('search', search.trim()); setTasks(await request<Task[]>(`/api/tasks${params.size ? `?${params}` : ''}`)); setError('') } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to load tasks') } finally { setLoading(false) }
  }
  useEffect(() => { if (!token) return; request<User>('/api/auth/me').then(setUser).catch(handleLogout) }, [token])
  useEffect(() => { loadTasks() }, [token, view, category, search])
  useEffect(() => { setCustomCategories(token ? JSON.parse(localStorage.getItem(`stm_categories_${token}`) || '[]') : []) }, [token])
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('stm_theme', theme) }, [theme])
  useEffect(() => { localStorage.setItem('stm_display', displayMode) }, [displayMode])
  const allCategories = [...builtInCategories, ...customCategories]
  const createCategory = (name: string) => { const cleanName = name.trim().toLowerCase(); if (!cleanName || allCategories.includes(cleanName)) return cleanName; const nextCategories = [...customCategories, cleanName]; setCustomCategories(nextCategories); localStorage.setItem(`stm_categories_${token || 'guest'}`, JSON.stringify(nextCategories)); return cleanName }

  const visibleTasks = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const filtered = tasks.filter((task) => {
      const matchesView = view === 'all' || (view === 'pending' && !task.completed) || (view === 'completed' && task.completed)
      const matchesCategory = category === 'all' || task.category === category
      const matchesPriority = priority === 'all' || task.priority === Number(priority)
      const matchesDue = dueFilter === 'all' || (dueFilter === 'none' && !task.due_date) || (dueFilter === 'scheduled' && Boolean(task.due_date)) || (dueFilter === 'today' && task.due_date === today) || (dueFilter === 'overdue' && Boolean(task.due_date && task.due_date < today && !task.completed))
      return matchesView && matchesCategory && matchesPriority && matchesDue
    })
    return [...filtered].sort((first, second) => sortMode === 'newest' ? new Date(second.created_at).getTime() - new Date(first.created_at).getTime() : sortMode === 'due' ? (first.due_date || '9999').localeCompare(second.due_date || '9999') : first.priority - second.priority)
  }, [tasks, category, priority, dueFilter, sortMode])

  if (!token) return <AuthScreen onAuthenticated={(nextToken) => { localStorage.setItem('stm_token', nextToken); setToken(nextToken) }} theme={theme} setTheme={setTheme} />
  const completedCount = tasks.filter((task) => task.completed).length
  const pendingCount = tasks.filter((task) => !task.completed).length

  return <div className="app-shell">
    <header className="topbar"><button className="brand" onClick={() => { setView('all'); setCategory('all') }}><span className="brand-mark"><Sparkles size={16} /></span> STUDIO / TASKS</button><div className="topbar-meta"><span className="live-dot" /> {user?.name || 'STUDENT'} <span className="topbar-divider" /> 2026 / 09</div><button className="icon-button menu-button" aria-label="Open menu"><Menu size={20} /></button></header>
    <main className="dashboard">
      <section className="intro reveal"><div><p className="eyebrow">PERSONAL COMMAND CENTRE <span>/// 001</span></p><h1>MAKE ROOM<br /><em>FOR DONE.</em></h1></div><div className="intro-note"><p>Academic, personal, and everything in between. Keep the signal clear.</p><ArrowUpRight size={27} /></div></section>
      <section className="stats-grid"><Stat label="TOTAL TASKS" value={tasks.length} accent="lime" /><Stat label="IN PROGRESS" value={pendingCount} accent="ink" /><Stat label="COMPLETED" value={completedCount} accent="orange" /><div className="theme-control"><span>DISPLAY MODE</span><div className="display-modes">{(['list', 'grid', 'spotlight'] as DisplayMode[]).map((mode) => <button key={mode} className={`display-mode ${displayMode === mode ? 'active' : ''}`} onClick={() => setDisplayMode(mode)} aria-label={`${mode} display mode`}>{mode === 'list' ? '///' : mode === 'grid' ? ':::' : '—'}</button>)}</div><div className="theme-dots">{themes.map((option) => <button key={option} className={`theme-dot ${option} ${theme === option ? 'active' : ''}`} onClick={() => setTheme(option)} aria-label={`${option} color theme`} />)}</div></div></section>
      <section className="workspace"><aside className="sidebar"><div className="side-label">VIEW / SORT</div><nav className="view-nav">{(['all', 'pending', 'completed'] as View[]).map((item) => <button key={item} className={view === item ? 'active' : ''} onClick={() => setView(item)}><span>{item === 'all' ? 'Everything' : item === 'pending' ? 'In progress' : 'Completed'}</span><b>{item === 'all' ? tasks.length : item === 'pending' ? pendingCount : completedCount}</b></button>)}</nav><div className="side-label category-label">CATEGORIES</div><nav className="category-nav">{['all', ...allCategories].map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}><span className={`category-dot ${item}`} />{item}</button>)}<button className="add-category-link" onClick={() => { setEditingTask(null); setShowForm(true) }}>+ new category</button></nav><div className="sidebar-footer"><span>STUDIO TASKS / V1</span><span>BUILT FOR MOMENTUM</span></div></aside>
        <div className="task-area"><div className="toolbar"><div className="search-wrap"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your tasks" /></div><button className={`filter-button ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}><Filter size={15} /> FILTER {priority !== 'all' || dueFilter !== 'all' ? '•' : ''}</button><button className="new-task" onClick={() => { setEditingTask(null); setShowForm(true) }}><Plus size={17} /> NEW TASK</button></div>{showFilters && <FilterPanel priority={priority} setPriority={setPriority} dueFilter={dueFilter} setDueFilter={setDueFilter} sortMode={sortMode} setSortMode={setSortMode} onClear={() => { setPriority('all'); setDueFilter('all'); setSortMode('priority') }} />}{error && <div className="error-banner">{error}<button onClick={() => setError('')} aria-label="Dismiss error"><X size={15} /></button></div>}<div className="list-heading"><span>{view === 'all' ? 'ALL TASKS' : view.toUpperCase()}</span><span>{loading ? <LoaderCircle className="spin" size={15} /> : `${visibleTasks.length} ITEMS`}</span></div><div className={`task-list mode-${displayMode}`}>{visibleTasks.map((task, index) => <TaskRow key={task.id} task={task} index={index} onToggle={async () => { try { const updated = await request<Task>(`/api/tasks/${encodeURIComponent(task.title)}/toggle`, { method: 'PATCH' }); setTasks((current) => current.map((item) => item.id === task.id ? updated : item)) } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to update task') } }} onEdit={() => { setEditingTask(task); setShowForm(true) }} onDelete={async () => { if (!confirm('Delete this task?')) return; await request(`/api/tasks/${encodeURIComponent(task.title)}`, { method: 'DELETE' }); setTasks((current) => current.filter((item) => item.id !== task.id)) }} />)}{!loading && !visibleTasks.length && <div className="empty-state reveal"><Circle size={28} /><h2>Nothing here yet.</h2><p>Try a different filter or start with one small thing.</p><button onClick={() => setShowForm(true)}>CREATE A TASK <Plus size={15} /></button></div>}</div></div></section>
    </main>{showForm && <TaskModal task={editingTask} categories={allCategories} onCreateCategory={createCategory} onClose={() => setShowForm(false)} onSaved={(savedTask) => { setTasks((current) => editingTask ? current.map((task) => task.id === savedTask.id ? savedTask : task) : [savedTask, ...current]); setShowForm(false) }} request={request} />}<button className="logout-button" onClick={handleLogout}><LogOut size={15} /> LOG OUT</button>
  </div>
}

function FilterPanel({ priority, setPriority, dueFilter, setDueFilter, sortMode, setSortMode, onClear }: { priority: string; setPriority: (value: string) => void; dueFilter: DueFilter; setDueFilter: (value: DueFilter) => void; sortMode: SortMode; setSortMode: (value: SortMode) => void; onClear: () => void }) {
  return <div className="filter-panel reveal"><div><span className="filter-label">PRIORITY</span><div className="filter-options">{[['all', 'ALL'], ['1', 'HIGH'], ['2', 'MED'], ['3', 'LOW']].map(([value, label]) => <button key={value} className={priority === value ? 'selected' : ''} onClick={() => setPriority(value)}>{label}</button>)}</div></div><div><span className="filter-label">DUE DATE</span><div className="filter-options">{([['all', 'ANY'], ['today', 'TODAY'], ['overdue', 'OVERDUE'], ['scheduled', 'SCHEDULED'], ['none', 'NO DATE']] as [DueFilter, string][]).map(([value, label]) => <button key={value} className={dueFilter === value ? 'selected' : ''} onClick={() => setDueFilter(value)}>{label}</button>)}</div></div><div><span className="filter-label">SORT BY</span><div className="filter-options">{([['priority', 'PRIORITY'], ['newest', 'NEWEST'], ['due', 'DUE DATE']] as [SortMode, string][]).map(([value, label]) => <button key={value} className={sortMode === value ? 'selected' : ''} onClick={() => setSortMode(value)}>{label}</button>)}</div></div><button className="clear-filters" onClick={onClear}>CLEAR ALL</button></div>
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) { return <div className={`stat-card ${accent}`}><span>{label}</span><strong>{String(value).padStart(2, '0')}</strong><ArrowUpRight size={17} /></div> }

function TaskRow({ task, index, onToggle, onEdit, onDelete }: { task: Task; index: number; onToggle: () => void; onEdit: () => void; onDelete: () => void }) { const due = task.due_date ? new Date(`${task.due_date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'NO DATE'; return <article className={`task-row reveal ${task.completed ? 'complete' : ''}`} style={{ animationDelay: `${index * 40}ms` }}><button className={`check-button ${task.completed ? 'checked' : ''}`} onClick={onToggle} aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}>{task.completed && <Check size={16} strokeWidth={3} />}</button><div className="task-copy"><div className="task-title-line"><h3>{task.title}</h3><span className={`priority p${task.priority}`}>{task.priority === 1 ? 'HIGH' : task.priority === 2 ? 'MED' : 'LOW'}</span></div><p>{task.description || 'No description added.'}</p></div><div className="task-meta"><span className={`category-tag ${task.category}`}>{task.category}</span><span>{due}</span></div><div className="task-actions"><button onClick={onEdit}>EDIT</button><button onClick={onDelete} aria-label={`Delete ${task.title}`}><Trash2 size={16} /></button></div></article> }

function AuthScreen({ onAuthenticated, theme, setTheme }: { onAuthenticated: (token: string) => void; theme: Theme; setTheme: (theme: Theme) => void }) { const [register, setRegister] = useState(false); const [form, setForm] = useState({ name: '', email: '', password: '' }); const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const submit = async (event: FormEvent) => { event.preventDefault(); setLoading(true); try { const authResponse = await fetch(`${API_URL}/api/auth/${register ? 'register' : 'login'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); const data = await authResponse.json(); if (!authResponse.ok) throw new Error(data.detail || 'Unable to sign in'); if (register) { const loginResponse = await fetch(`${API_URL}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.email, password: form.password }) }); onAuthenticated((await loginResponse.json()).access_token) } else onAuthenticated(data.access_token) } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to sign in') } finally { setLoading(false) } }; return <div className="auth-screen"><header className="topbar"><div className="brand"><span className="brand-mark"><Sparkles size={16} /></span> STUDIO / TASKS</div><div className="theme-dots">{themes.map((option) => <button key={option} className={`theme-dot ${option} ${theme === option ? 'active' : ''}`} onClick={() => setTheme(option)} aria-label={`${option} theme`} />)}</div></header><main className="auth-content"><p className="eyebrow">A QUIET PLACE FOR LOUD AMBITIONS <span>/// 000</span></p><h1>MAKE ROOM<br /><em>FOR DONE.</em></h1><div className="auth-card"><div className="auth-card-top"><span>{register ? 'SIGN UP' : 'LOG IN'}</span><span>01 / 01</span></div><h2>{register ? 'Make a space for your work.' : 'Welcome back to your work.'}</h2><p className="auth-lede">{register ? 'One clear place for every task worth finishing.' : 'Your next finished thing is already waiting.'}</p><form onSubmit={submit}>{register && <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" />}<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email address" /><input required minLength={6} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Password" />{error && <p className="form-error">{error}</p>}<button className="submit-button" disabled={loading}>{loading ? <LoaderCircle className="spin" size={17} /> : register ? 'CREATE ACCOUNT' : 'ENTER STUDIO'} <ArrowUpRight size={18} /></button></form><button className="switch-auth" onClick={() => { setRegister(!register); setError('') }}>{register ? 'Already have an account? Log in' : 'New here? Sign up'}</button></div></main><footer className="auth-footer"><span>STUDIO TASKS / V1</span><span>© 2026 / YOUR DAILY PRACTICE</span></footer></div> }

function TaskModal({ task, categories, onCreateCategory, onClose, onSaved, request }: { task: Task | null; categories: string[]; onCreateCategory: (name: string) => string; onClose: () => void; onSaved: (task: Task) => void; request: ApiRequest }) { const [form, setForm] = useState({ title: task?.title || '', description: task?.description || '', priority: task?.priority || 2, category: task?.category || 'academic', due_date: task?.due_date || '' }); const [newCategory, setNewCategory] = useState(''); const [showNewCategory, setShowNewCategory] = useState(false); const [saving, setSaving] = useState(false); const submit = async (event: FormEvent) => { event.preventDefault(); setSaving(true); try { const saved = await request<Task>(task ? `/api/tasks/${encodeURIComponent(task.title)}` : '/api/tasks', { method: task ? 'PUT' : 'POST', body: JSON.stringify({ ...form, due_date: form.due_date || null }) }); onSaved(saved) } finally { setSaving(false) } }; const addCategory = () => { const category = onCreateCategory(newCategory); if (category) { setForm({ ...form, category }); setNewCategory(''); setShowNewCategory(false) } }; return <div className="modal-backdrop reveal" onClick={onClose}><div className="task-modal" onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}><div className="modal-heading"><div><p className="eyebrow">TASK ENTRY / {task ? 'EDIT' : 'NEW'}</p><h2>{task ? 'Shape the task.' : 'Put it somewhere.'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X /></button></div><form onSubmit={submit}><label>TITLE<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Submit research outline" /></label><label>DESCRIPTION<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Add useful context" rows={3} /></label><div className="form-row"><label>PRIORITY<select value={form.priority} onChange={(event) => setForm({ ...form, priority: Number(event.target.value) })}><option value={1}>High</option><option value={2}>Medium</option><option value={3}>Low</option></select></label><label>CATEGORY<select value={form.category} onChange={(event) => event.target.value === '__new__' ? setShowNewCategory(true) : setForm({ ...form, category: event.target.value })}>{categories.map((item) => <option key={item}>{item}</option>)}<option value="__new__">+ Create new category</option></select>{showNewCategory && <div className="new-category-row"><input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="e.g. side project" /><button type="button" onClick={addCategory}>ADD</button></div>}</label></div><label>DUE DATE<input type="date" value={form.due_date} onChange={(event) => setForm({ ...form, due_date: event.target.value })} /></label><button className="submit-button" disabled={saving}>{saving ? <LoaderCircle className="spin" size={17} /> : task ? 'SAVE CHANGES' : 'ADD TO LIST'} <ArrowUpRight size={18} /></button></form></div></div> }

export default App
