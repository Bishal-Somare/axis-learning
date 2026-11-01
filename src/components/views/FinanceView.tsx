import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, exportToCsv } from '../../services/api';
import { FeeInvoice, FeePayment, ExpenseRecord } from '../../types';
import { 
  CreditCard, DollarSign, Download, Plus, 
  Printer, CheckCircle2, AlertTriangle, 
  ArrowUpRight, ArrowDownRight, X, FileText 
} from 'lucide-react';

export const FinanceView: React.FC = () => {
  const { isSuperAdmin, user } = useAuth();
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Active view tab: 'invoices', 'payments', 'expenses'
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'expenses'>('invoices');

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState<FeeInvoice | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [printReceiptPayment, setPrintReceiptPayment] = useState<FeePayment | null>(null);

  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'eSewa' | 'Khalti' | 'Bank Transfer' | 'Cheque'>('eSewa');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Expense Form
  const [newExpense, setNewExpense] = useState({
    category: 'Rent' as any,
    amount: '',
    description: '',
    paymentMethod: 'Bank Transfer' as any,
    receiptNumber: ''
  });
  const [submittingExpense, setSubmittingExpense] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invList, payList, expList] = await Promise.all([
        api.getInvoices(),
        api.getPayments(),
        api.getExpenses()
      ]);
      setInvoices(invList);
      setPayments(payList);
      setExpenses(expList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenPayment = (inv: FeeInvoice) => {
    setShowPaymentModal(inv);
    setPaymentAmount(inv.dueAmount);
    setPaymentRef('');
    setPaymentNotes('');
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPaymentModal) return;

    try {
      setSubmittingPayment(true);
      const res = await api.recordPayment({
        invoiceId: showPaymentModal.id,
        amount: Number(paymentAmount),
        paymentMethod,
        referenceNumber: paymentRef,
        notes: paymentNotes
      });

      setShowPaymentModal(null);
      setPrintReceiptPayment(res.payment);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Payment recording failed');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingExpense(true);
      await api.recordExpense({
        ...newExpense,
        amount: Number(newExpense.amount)
      });
      setShowExpenseModal(false);
      setNewExpense({
        category: 'Printing & Materials',
        amount: '',
        description: '',
        paymentMethod: 'Cash',
        receiptNumber: ''
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to record expense');
    } finally {
      setSubmittingExpense(false);
    }
  };

  // CSV Export for Invoices & Dues
  const handleExportInvoicesCsv = () => {
    const headers = ['Invoice No', 'Student ID', 'Student Name', 'Grade', 'Month', 'Tuition Fee', 'Discount', 'Net Payable', 'Paid', 'Due Amount', 'Status'];
    const rows = invoices.map(i => [
      i.invoiceNumber,
      i.studentId,
      i.studentName,
      i.grade,
      i.month,
      i.tuitionFee,
      i.discount,
      i.netPayable,
      i.paidAmount,
      i.dueAmount,
      i.status
    ]);
    exportToCsv(`Axis_Invoices_${new Date().toISOString().split('T')[0]}`, [headers, ...rows]);
  };

  // CSV Export for Expenses
  const handleExportExpensesCsv = () => {
    const headers = ['Expense ID', 'Date', 'Category', 'Description', 'Amount (NPR)', 'Payment Method', 'Entered By', 'Receipt Reference'];
    const rows = expenses.map(e => [
      e.id,
      e.expenseDate,
      e.category,
      e.description,
      e.amount,
      e.paymentMethod,
      e.enteredBy,
      e.receiptNumber || ''
    ]);
    exportToCsv(`Axis_Expenses_${new Date().toISOString().split('T')[0]}`, [headers, ...rows]);
  };

  const totalInvoiced = invoices.reduce((acc, i) => acc + i.netPayable, 0);
  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalOutstanding = invoices.reduce((acc, i) => acc + i.dueAmount, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netBalance = totalCollected - totalExpenses;

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center text-slate-500">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-800">Restricted Financial Module</h2>
        <p className="text-xs text-slate-500 mt-1">
          Access to student tuition fee records and coaching center operational expenses is strictly restricted to the Super Administrator / Founding Owners.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Financial Accounts & Fee Collection
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tuition fee invoicing, payment receipts, outstanding balances, and center operating expenditures
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'invoices' && (
            <button
              onClick={handleExportInvoicesCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Invoices CSV</span>
            </button>
          )}

          {activeTab === 'expenses' && (
            <>
              <button
                onClick={handleExportExpensesCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export Expenses CSV</span>
              </button>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-800 rounded-lg shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Expense</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 4-Stat Financial Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-xs text-slate-500">Total Invoiced</div>
          <div className="mt-1.5 text-xl font-bold font-mono text-slate-900 tabular-nums">
            NPR {totalInvoiced.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Session 2081/82</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-xs text-slate-500">Fee Collected</div>
          <div className="mt-1.5 text-xl font-bold font-mono text-emerald-950 tabular-nums">
            NPR {totalCollected.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">Verified receipts</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-xs text-slate-500">Outstanding Dues</div>
          <div className="mt-1.5 text-xl font-bold font-mono text-rose-950 tabular-nums">
            NPR {totalOutstanding.toLocaleString()}
          </div>
          <div className="text-[11px] text-rose-700 mt-0.5 font-medium">Pending collection</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-xs text-slate-500">Center Operating Expenses</div>
          <div className="mt-1.5 text-xl font-bold font-mono text-slate-900 tabular-nums">
            NPR {totalExpenses.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Rent, NEA, materials</div>
        </div>
      </div>

      {/* Segmented Controls */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'invoices' ? 'bg-white text-indigo-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Fee Invoices & Dues
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'payments' ? 'bg-white text-indigo-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Payment Transactions
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'expenses' ? 'bg-white text-indigo-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Operating Expenses
        </button>
      </div>

      {/* TAB: INVOICES */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Student & Grade</th>
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4 text-right">Tuition Fee</th>
                  <th className="py-3 px-4 text-right">Net Payable</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Due Balance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 tabular-nums">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{inv.studentName}</div>
                      <div className="font-mono text-[11px] text-slate-400">{inv.studentId} · {inv.grade}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{inv.month}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      NPR {inv.tuitionFee.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      NPR {inv.netPayable.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                      NPR {inv.paidAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-rose-700 font-bold">
                      NPR {inv.dueAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-800'
                          : inv.status === 'PARTIAL'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-rose-50 text-rose-800'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {inv.dueAmount > 0 && (
                        <button
                          onClick={() => handleOpenPayment(inv)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-white bg-indigo-900 hover:bg-indigo-800 rounded shadow-xs"
                        >
                          Receive Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Receipt No</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Payment Channel</th>
                  <th className="py-3 px-4">Reference No</th>
                  <th className="py-3 px-4 text-right">Amount (NPR)</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 tabular-nums">
                      {p.receiptNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{p.studentName}</div>
                      <div className="font-mono text-[11px] text-slate-400">{p.studentId}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{p.paymentDate}</td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {p.referenceNumber || '–'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800 tabular-nums">
                      NPR {p.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setPrintReceiptPayment(p)}
                        className="p-1 text-slate-500 hover:text-indigo-900 hover:bg-slate-100 rounded"
                        title="Print Official Receipt"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Entered By</th>
                  <th className="py-3 px-4 text-right">Amount (NPR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-700">{e.expenseDate}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-800">{e.description}</td>
                    <td className="py-3 px-4 text-slate-600">{e.paymentMethod}</td>
                    <td className="py-3 px-4 text-slate-500">{e.enteredBy}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-800 tabular-nums">
                      NPR {e.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Receive Payment */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">Record Fee Collection</h2>
              <button 
                onClick={() => setShowPaymentModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="font-bold text-slate-900">{showPaymentModal.studentName} ({showPaymentModal.grade})</div>
                <div className="text-slate-500 text-[11px] font-mono mt-0.5">
                  Invoice: {showPaymentModal.invoiceNumber} · Outstanding: NPR {showPaymentModal.dueAmount.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Payment Amount (NPR) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={showPaymentModal.dueAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden font-mono font-bold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Payment Channel *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden"
                  >
                    <option value="Cash">Cash</option>
                    <option value="eSewa">eSewa</option>
                    <option value="Khalti">Khalti</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Transaction Ref No</label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="e.g. ESEWA-9921"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Receipt Remarks</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Monthly tuition installment"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-4 py-1.5 rounded-lg bg-indigo-900 text-white font-semibold hover:bg-indigo-800 shadow-xs"
                >
                  {submittingPayment ? 'Processing...' : 'Confirm Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Operating Expense */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">Record Operating Expense</h2>
              <button 
                onClick={() => setShowExpenseModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordExpense} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Category *</label>
                <select
                  value={newExpense.category}
                  onChange={(e: any) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden"
                >
                  <option value="Rent">Rent</option>
                  <option value="Electricity & Utilities">Electricity & Utilities</option>
                  <option value="Printing & Materials">Printing & Materials</option>
                  <option value="Teacher Honorarium">Teacher Honorarium</option>
                  <option value="Refreshment">Refreshment</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Amount (NPR) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  placeholder="e.g. 8500"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Description *</label>
                <input
                  type="text"
                  required
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="e.g. Model question test booklets printing"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={newExpense.paymentMethod}
                    onChange={(e: any) => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="eSewa">eSewa</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Bill / Receipt Ref</label>
                  <input
                    type="text"
                    value={newExpense.receiptNumber}
                    onChange={(e) => setNewExpense({ ...newExpense, receiptNumber: e.target.value })}
                    placeholder="e.g. BILL-441"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingExpense}
                  className="px-4 py-1.5 rounded-lg bg-indigo-900 text-white font-semibold hover:bg-indigo-800 shadow-xs"
                >
                  {submittingExpense ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {printReceiptPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Official Payment Receipt</h2>
              <button 
                onClick={() => setPrintReceiptPayment(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs text-slate-800">
              {/* Receipt Header */}
              <div className="text-center border-b border-slate-200 pb-4">
                <div className="text-base font-extrabold text-indigo-950">AXIS LEARNING TUITION & COACHING CENTRE</div>
                <div className="text-[11px] text-slate-500">Shankhamul Road, Butwal Shitalnagar, Nepal · Ph: +977-1-4412345</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">PAN: 601294857 · Established by 5 Founding Faculty</div>
              </div>

              {/* Receipt Meta */}
              <div className="flex justify-between font-mono text-[11px] border-b border-slate-100 pb-3">
                <div>
                  <span className="text-slate-400">Receipt No: </span>
                  <span className="font-bold text-slate-900">{printReceiptPayment.receiptNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400">Date: </span>
                  <span className="font-bold text-slate-900">{printReceiptPayment.paymentDate}</span>
                </div>
              </div>

              {/* Student Details */}
              <div className="space-y-1">
                <div><span className="text-slate-500">Received with thanks from:</span> <strong className="text-slate-900">{printReceiptPayment.studentName}</strong> ({printReceiptPayment.studentId})</div>
                <div><span className="text-slate-500">Payment Method:</span> <span className="font-medium text-slate-800">{printReceiptPayment.paymentMethod}</span> (Ref: {printReceiptPayment.referenceNumber || 'Cash'})</div>
                <div><span className="text-slate-500">Authorized Receiver:</span> {printReceiptPayment.receivedBy}</div>
              </div>

              {/* Big Amount Box */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Amount Paid</div>
                <div className="text-2xl font-extrabold font-mono text-indigo-950 mt-1 tabular-nums">
                  NPR {printReceiptPayment.amount.toLocaleString()}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 text-center italic">
                This is a computer-generated receipt from the Axis Learning Management Portal. No signature required.
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-900 text-white font-semibold hover:bg-indigo-800 text-xs shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setPrintReceiptPayment(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
