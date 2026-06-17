import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function BillingPage() {
  const { user } = useAuthStore()
  const [invoices, setInvoices] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const isStudent = user?.role === 'student'
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    const params = isStudent && user?.id ? `?student_id=${user.id}` : ''
    Promise.all([
      api.get(`/billing/${params}`),
      api.get('/billing/summary/'),
    ]).then(([ir, sr]) => {
      setInvoices(Array.isArray(ir.data) ? ir.data : ir.data.results || [])
      setSummary(sr.data || {})
    }).catch(() => {}).finally(() => setLoading(false))
  }, [isStudent, user?.id])

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { pending: 'bg-amber-50 text-amber-700', paid: 'bg-emerald-50 text-emerald-700', overdue: 'bg-red-50 text-red-700', cancelled: 'bg-gray-50 text-gray-500' }
    const labels: Record<string, string> = { pending: 'En attente', paid: 'Payée', overdue: 'En retard', cancelled: 'Annulée' }
    return <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${map[s] || ''}`}>{labels[s] || s}</span>
  }

  if (loading) return (
    <div className="animate-fadeIn space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Factures</h1>
      <div className="card p-6 space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
    </div>
  )

  const paid = invoices.filter(i => i.status === 'paid').reduce((a, i) => a + parseFloat(i.amount), 0)
  const total = invoices.reduce((a, i) => a + parseFloat(i.amount), 0)

  return (
    <div className="animate-fadeIn space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Facturation</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-xs text-gray-400">Payé</p>
            <p className="text-xl font-bold text-emerald-600">{paid.toFixed(2)} DH</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-xs text-gray-400">En attente</p>
            <p className="text-xl font-bold text-amber-600">{(total - paid).toFixed(2)} DH</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>
          </div>
          <div>
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-xl font-bold text-indigo-600">{total.toFixed(2)} DH</p>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <div>
              <p className="text-xs text-gray-400">Budget total</p>
              <p className="text-xl font-bold text-blue-600">{summary.total_budget || '0'} DH</p>
            </div>
          </div>
          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
            </div>
            <div>
              <p className="text-xs text-gray-400">Dépensé</p>
              <p className="text-xl font-bold text-rose-600">{summary.total_spent || '0'} DH</p>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Libellé', 'Montant', 'Échéance', 'Statut'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-sm font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">Aucune facture</td></tr>
            ) : invoices.map((inv: any) => (
              <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-800">{inv.label}</td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-800">{inv.amount} DH</td>
                <td className="px-6 py-4 text-sm text-gray-500">{inv.due_date ? new Date(inv.due_date).toLocaleDateString('fr-FR') : '-'}</td>
                <td className="px-6 py-4">{statusBadge(inv.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
