import React, { useEffect, useMemo, useState } from 'react'
import { dashboardStyles, trendStyles, chartStyles } from '../assets/dummyStyles'
import { GAUGE_COLORS, COLORS, INCOME_CATEGORY_ICONS, EXPENSE_CATEGORY_ICONS } from '../assets/color'
import { useOutlet, useOutletContext } from 'react-router-dom'
import {getTimeFrameRange, getPreviousTimeFrameRange, calculateData} from '../components/Helpers'
import axios from 'axios'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import {
  Plus,
  Wallet,
  TrendingDown,
  PiggyBank,
  PieChart as PieChartIcon,
  TrendingUp as ProfitIcon,
  ArrowDown,
  DollarSign,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import GaugeCard from '../components/GaugeCard'
import AddTransactionModal from '../components/Add'


const API_BASE = 'https://xpensy.onrender.com/api'

const getAuthHeader = () => {
  const token = localStorage.getItem("token") || localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token} ` } : {};
};

//to convert date to ISO time
function toIsoWithClientTime(dateValue) {
  if (!dateValue) {
    return new Date().toISOString();
  }

  if (typeof dateValue === "string" && dateValue.length === 10) {
    const now = new Date();
    const hhmmss = now.toTimeString().slice(0, 8);
    const combined = new Date(`${dateValue}T${hhmmss}`);
    return combined.toISOString();
  }

  try {
    return new Date(dateValue).toISOString();
  } catch (err) {
    return new Date().toISOString();
  }
}

const DashBoard = () => {
  //get refreshTransactions from the outlet context
  const {
    transactions: outletTransactions = [],
    timeFrame = "monthly",
    setTimeFrame = () => { },
    refreshTransactions
  } = useOutletContext();

  const [showModal, setShowModal] = useState(false);
  const [gaugeData, setGaugeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [overviewMeta, setOverviewMeta] = useState({});
  const [showAllIncome, setShowAllIncome] = useState(false); //to toggle
  const [showAllExpense, setShowAllExpense] = useState(false);

  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    type: "expense",
    category: "Food",
  });

  const timeFrameRange = useMemo(() => getTimeFrameRange(timeFrame), [timeFrame]);
  const prevTimeFrameRange = useMemo(() => getPreviousTimeFrameRange(timeFrame), [timeFrame]);

  const isDateInRange = (date, start, end) => {
    const transactionDate = new Date(date);
    const startDate = new Date(start);
    const endDate = new Date(end);
    transactionDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return transactionDate >= startDate && transactionDate <= endDate;
  };

  //to filter using date and time
  const filteredTransactions = useMemo(
    () => (outletTransactions || []).filter((t) =>
      isDateInRange(t.date, timeFrameRange.start, timeFrameRange.end)
    ),
    [outletTransactions, timeFrameRange]
  );

  const prevFilteredTransactions = useMemo(
    () => (outletTransactions || []).filter((t) =>
      isDateInRange(t.date, prevTimeFrameRange.start, prevTimeFrameRange.end)
    ),
    [outletTransactions, prevTimeFrameRange]
  );

  //calculate data
  const currentTimeFrameData = useMemo(() => {
    const data = calculateData(filteredTransactions);
    data.savings = data.income - data.expenses;
    return data;
  }, [filteredTransactions]);

  const prevTimeFrameData = useMemo(() => {
    const data = calculateData(prevFilteredTransactions);
    data.savings = data.income - data.expenses;
    return data;
  }, [prevFilteredTransactions]);

  //update the gauge when time frame changes
  useEffect(() => {
    const maxValues = {
      income: Math.max(currentTimeFrameData.income, 5000),
      expenses: Math.max(currentTimeFrameData.expenses, 3000),
      savings: Math.max(Math.abs(currentTimeFrameData.savings), 2000),
    };

    setGaugeData([
      { name: "Income", value: currentTimeFrameData.income, max: maxValues.income },
      { name: "Spent", value: currentTimeFrameData.expenses, max: maxValues.expenses },
      { name: "Savings", value: currentTimeFrameData.savings, max: maxValues.savings },
    ]);
  }, [currentTimeFrameData, timeFrame]); //the graph will be fill acording to this data

  const displayIncome =
    timeFrame === "monthly" && typeof overviewMeta.monthlyIncome === "number"
      ? overviewMeta.monthlyIncome
      : currentTimeFrameData.income;

  const displayExpenses =
    timeFrame === "monthly" && typeof overviewMeta.monthlyExpense === "number"
      ? overviewMeta.monthlyExpense
      : currentTimeFrameData.expenses;

  const displaySavings =
    timeFrame === "monthly" && typeof overviewMeta.savings === "number"
      ? overviewMeta.savings
      : currentTimeFrameData.savings;

  //expense change percentage
  const expenseChange = useMemo(() => {
    const prev = prevTimeFrameData.expenses;
    const curr = displayExpenses;
    if (!prev) {
      if (!curr) return 0;
      return 100;
    }
    return Math.round(((curr - prev) / prev) * 100);
  }, [prevTimeFrameData, displayExpenses]);

  //expense distribution
  const financialOverviewData = useMemo(() => {
    if (
      timeFrame === "monthly" &&
      overviewMeta.expenseDistribution &&
      Array.isArray(overviewMeta.expenseDistribution) &&
      overviewMeta.expenseDistribution.length > 0
    ) {
      return overviewMeta.expenseDistribution.map((d) => ({
        name: d.category,
        value: Math.round(Number(d.amount) || 0),
      }));
    }

    const categories = {};
    filteredTransactions.forEach((transaction) => {
      if (transaction.type === "expense") {
        categories[transaction.category] =
          (categories[transaction.category] || 0) + transaction.amount;
      }
    });

    return Object.keys(categories).map((category) => ({
      name: category,
      value: Math.round(categories[category]),
    }));
  }, [filteredTransactions, overviewMeta, timeFrame]);

  // build server-provided recent list
  const serverRecent = overviewMeta.recentTransactions || [];
  const serverRecentIncome = serverRecent
    .filter((t) => t.type === "income")
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const serverRecentExpense = serverRecent
    .filter((t) => t.type === "expense")
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const incomeTransactions = useMemo(
    () => filteredTransactions
      .filter((t) => t.type === "income")
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [filteredTransactions]
  );

  const expenseTransactions = useMemo(
    () => filteredTransactions
      .filter((t) => t.type === "expense")
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [filteredTransactions]
  );

  const incomeListForDisplay =
    timeFrame === "monthly" && serverRecentIncome.length > 0
      ? serverRecentIncome
      : incomeTransactions;

  const expenseListForDisplay =
    timeFrame === "monthly" && serverRecentExpense.length > 0
      ? serverRecentExpense
      : expenseTransactions;

  const displayedIncome = showAllIncome
    ? incomeListForDisplay
    : incomeListForDisplay.slice(0, 3);

  const displayedExpense = showAllExpense
    ? expenseListForDisplay
    : expenseListForDisplay.slice(0, 3);

  //fetch the server-side data
  const fetchDashboardOverview = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/dashboard`, {
        headers: getAuthHeader(),
      });

      if (res?.data?.success) {
        const data = res.data.data;

        const recent = (data.recentTransactions || []).map((item) => {
          const typeFromServer =
            item.type || (item.category ? "expense" : "income");
          const amountNum = Number(item.amount) || 0;

          const isoDate = item.date
            ? new Date(item.date).toISOString()
            : item.createdAt
              ? new Date(item.createdAt).toISOString()
              : new Date().toISOString();

          return {
            id: item._id || item.id || Date.now() + Math.random(),
            date: isoDate,
            description:
              item.description ||
              item.note ||
              item.title ||
              (typeFromServer === "income"
                ? item.source || "Income"
                : item.category || "Expense"),
            amount: amountNum,
            type: typeFromServer,
            category:
              item.category ||
              (typeFromServer === "income" ? "Salary" : "Other"),
            raw: item,
          };
        });

        setOverviewMeta((prev) => ({
          ...prev,
          monthlyIncome: Number(data.monthlyIncome || 0),
          monthlyExpense: Number(data.monthlyExpense || 0),
          savings:
            typeof data.savings !== "undefined"
              ? Number(data.savings)
              : Number(data.monthlyIncome || 0) - Number(data.monthlyExpense || 0),
          savingsRate:
            typeof data.savingsRate !== "undefined" ? data.savingsRate : null,
          spendByCategory: data.spendByCategory || {},
          expenseDistribution: data.expenseDistribution || [],
          recentTransactions: recent,
        }));

        if (timeFrame === "monthly") {
          const monthlyIncome = Number(data.monthlyIncome || 0);
          const monthlyExpense = Number(data.monthlyExpense || 0);
          const savings =
            typeof data.savings !== "undefined"
              ? Number(data.savings)
              : monthlyIncome - monthlyExpense;

          const maxValues = {
            income: Math.max(monthlyIncome, 5000),
            expenses: Math.max(monthlyExpense, 3000),
            savings: Math.max(Math.abs(savings), 2000),
          };

          setGaugeData([
            { name: "Income", value: monthlyIncome, max: maxValues.income },
            { name: "Spent", value: monthlyExpense, max: maxValues.expenses },
            { name: "Savings", value: savings, max: maxValues.savings },
          ]);
        }
      } else {
        console.warn("Dashboard endpoint returned success:false", res?.data);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard overview:", err?.response || err.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardOverview();
  }, []);

  // add/ edit or //delete
  const handleAddTransaction = async () => {
    if(!newTransaction.description || !newTransaction.amount) return;

    const payload = {
      date: toIsoWithClientTime(newTransaction.date),
      description: newTransaction.description,
      amount: parseFloat(newTransaction.amount),
      category: newTransaction.category,
    };

    try {
      setLoading(true);
      if(newTransaction.type === "income") {
        await axios.post(`${API_BASE}/income/add`, payload, {
          headers: getAuthHeader(),
        });
      } else {
        await axios.post(`${API_BASE}/expense/add`, payload, {
          headers: getAuthHeader(),
        });
      }
      await refreshTransactions();
      await fetchDashboardOverview();

      setNewTransaction({
        date: new Date().toISOString().split("T")[0],
        description: "",
        amount: "",
        type: "expense",
        category: "Food",
      });setShowModal(false);
    } catch (err) {
      console.error("Failed to add transactions:", err?.response || err.message || err);
    } finally{
      setLoading(false);
    }
  };

  const GAUGE_COLOR_MAP = {
    Income:  { gradientStart: "#14b8a6", gradientEnd: "#0891b2", text: "text-teal-700"   },
    Spent:   { gradientStart: "#f97316", gradientEnd: "#ef4444", text: "text-orange-600" },
    Savings: { gradientStart: "#8b5cf6", gradientEnd: "#6366f1", text: "text-violet-700" },
  };

  return (
    <div className={dashboardStyles.container}>

      {/* ── Header ── */}
      <div className={dashboardStyles.headerContainer}>
        <div className={dashboardStyles.headerContent}>
          <div>
            <h1 className={dashboardStyles.headerTitle}>Finance Dashboard</h1>
            <p className={dashboardStyles.headerSubtitle}>
              Track your income, expenses &amp; savings
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className={dashboardStyles.addButton}
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>

        {/* Time-frame selector */}
        <div className={dashboardStyles.timeFrameContainer}>
          <div className={dashboardStyles.timeFrameWrapper}>
            {[
              { key: "daily",   label: "Today" },
              { key: "weekly",  label: "Week"  },
              { key: "monthly", label: "Month" },
              { key: "yearly",  label: "Year"  },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => {
                  setTimeFrame(key);
                  setShowAllIncome(false);
                  setShowAllExpense(false);
                }}
                className={dashboardStyles.timeFrameButton(timeFrame === key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className={dashboardStyles.summaryGrid}>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className={dashboardStyles.walletIconContainer}>
              <Wallet className="w-5 h-5 text-teal-600" />
            </div>
            <span className={dashboardStyles.balanceBadge}>{timeFrameRange.label}</span>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Balance</p>
            <p className="text-2xl font-bold text-teal-700">
              ${Math.round(displayIncome - displayExpenses).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className={dashboardStyles.arrowDownIconContainer}>
              <TrendingDown className="w-5 h-5 text-orange-500" />
            </div>
            <span className={dashboardStyles.expenseBadge}>
              {expenseChange !== 0
                ? `${expenseChange > 0 ? "+" : ""}${expenseChange}% vs prev`
                : timeFrameRange.label}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-orange-600">
              ${Math.round(displayExpenses).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className={dashboardStyles.piggyBankIconContainer}>
              <PiggyBank className="w-5 h-5 text-cyan-600" />
            </div>
            <span className={
              displaySavings >= 0
                ? "bg-cyan-100 text-cyan-800 px-2 py-1 rounded-lg text-xs"
                : "bg-red-100 text-red-700 px-2 py-1 rounded-lg text-xs"
            }>
              {displaySavings >= 0 ? "Positive" : "Deficit"}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Net Savings</p>
            <p className={`text-2xl font-bold ${displaySavings >= 0 ? "text-cyan-700" : "text-red-600"}`}>
              {displaySavings < 0 ? "-" : ""}${Math.abs(Math.round(displaySavings)).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* ── Gauge Charts ── */}
      <div className={dashboardStyles.gaugeGrid}>
        {gaugeData.map((gauge) => (
          <GaugeCard
            key={gauge.name}
            gauge={gauge}
            colorInfo={GAUGE_COLOR_MAP[gauge.name] || {}}
            timeFrameLabel={timeFrameRange.label}
            highlightNegative={gauge.name === "Savings"}
          />
        ))}
      </div>

      {/* Expense distribution pie - Hidden on mobile */}
      <div className={dashboardStyles.pieChartContainer}>
        <div className={dashboardStyles.pieChartHeader}>
          <h3 className={dashboardStyles.pieChartTitle}>
            <PieChartIcon className="w-6 h-6 text-teal-500" />
            Expense Distribution
            <span className={dashboardStyles.listSubtitle}> ({timeFrameRange.label})</span>
          </h3>
        </div>

        <div className={dashboardStyles.pieChartHeight}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart className={chartStyles.pieChart}>
              <Pie
                data={financialOverviewData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name}: ${Math.round(percent * 100)}%`
                }
                labelLine={false}
              >
                {financialOverviewData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`$${Math.round(value).toLocaleString()}`, "Amount"]}
                contentStyle={dashboardStyles.tooltipContent}
                itemStyle={dashboardStyles.tooltipItem}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                formatter={(v) => (
                  <span className={dashboardStyles.legendText}>{v}</span>
                )}
                iconSize={10}
                iconType="circle"
                wrapperStyle={dashboardStyles.legendWrapper}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={dashboardStyles.listsGrid}>
        {/* Income Column */}
        <div className={dashboardStyles.listContainer}>
          <div className={dashboardStyles.listHeader}>
            <h3 className={dashboardStyles.listTitle}>
              <ProfitIcon className="w-6 h-6 text-green-500" /> Recent Income{" "}
              <span className={dashboardStyles.listSubtitle}> ({timeFrameRange.label})</span>
            </h3>
            <span className={dashboardStyles.incomeCountBadge}>
              {incomeListForDisplay.length} records
            </span>
          </div>

          <div className={dashboardStyles.transactionList}>
            {displayedIncome.map((transaction) => {
              const IconComponent = INCOME_CATEGORY_ICONS[transaction.category] || INCOME_CATEGORY_ICONS.Other;
              return (
                <div key={transaction.id} className={dashboardStyles.incomeTransactionItem}>
                  <div className={dashboardStyles.transactionContent}>
                    <div className={dashboardStyles.incomeIconContainer}>
                      {IconComponent}
                    </div>
                    <div>
                      <p className={dashboardStyles.transactionDescription}>{transaction.description}</p>
                      <p className={dashboardStyles.transactionCategory}>{transaction.category}</p>
                    </div>
                  </div>
                  <div className={dashboardStyles.transactionAmount}>
                    <p className={dashboardStyles.incomeAmount}>+${Math.abs(transaction.amount).toLocaleString()}</p>
                    <p className={dashboardStyles.transactionDate}>{new Date(transaction.date).toLocaleDateString()}</p>
                  </div>
                </div>
              );
            })}

            {incomeListForDisplay.length === 0 && (
              <div className={dashboardStyles.emptyState}>
                <div className={dashboardStyles.emptyIconContainer("bg-green-50")}>
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
                <p className={dashboardStyles.emptyText}>No income transactions</p>
              </div>
            )}

            {incomeListForDisplay.length > 3 && (
              <div className={dashboardStyles.viewAllContainer}>
                <button 
                  onClick={() => setShowAllIncome(!showAllIncome)}
                  className={dashboardStyles.viewAllButton}
                >
                  {showAllIncome ? (
                    <>
                      <ChevronUp className="w-5 h-5" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-5 h-5" />
                      View All Income ({incomeListForDisplay.length})
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Expense Column */}
        <div className={dashboardStyles.listContainer}>
          <div className={dashboardStyles.listHeader}>
            <h3 className="text-lg md:text-xl lg:text-xl xl:text-xl font-bold text-gray-800 md:mt-3 mt-3 flex items-center gap-3">
              <TrendingDown className="w-6 h-6 text-orange-500" /> Recent Expenses{" "}
              <span className={dashboardStyles.listSubtitle}> ({timeFrameRange.label})</span>
            </h3>
            <span className={dashboardStyles.expenseCountBadge}>
              {expenseListForDisplay.length} records
            </span>
          </div>

          <div className={dashboardStyles.transactionList}>
            {displayedExpense.map((transaction) => {
              const IconComponent = EXPENSE_CATEGORY_ICONS[transaction.category] || EXPENSE_CATEGORY_ICONS.Other;
              return (
                <div key={transaction.id} className={dashboardStyles.expenseTransactionItem}>
                  <div className={dashboardStyles.transactionContent}>
                    <div className={dashboardStyles.expenseIconContainer}>
                      {IconComponent}
                    </div>
                    <div>
                      <p className={dashboardStyles.transactionDescription}>{transaction.description}</p>
                      <p className={dashboardStyles.transactionCategory}>{transaction.category}</p>
                    </div>
                  </div>
                  <div className={dashboardStyles.transactionAmount}>
                    <p className={dashboardStyles.expenseAmount}>-${Math.abs(transaction.amount).toLocaleString()}</p>
                    <p className={dashboardStyles.transactionDate}>{new Date(transaction.date).toLocaleDateString()}</p>
                  </div>
                </div>
              );
            })}

            {expenseListForDisplay.length === 0 && (
              <div className={dashboardStyles.emptyState}>
                <div className={dashboardStyles.emptyIconContainer("bg-orange-50")}>
                  <ShoppingCart className="w-8 h-8 text-orange-400" />
                </div>
                <p className={dashboardStyles.emptyText}>No expense transactions</p>
              </div>
            )}

            {expenseListForDisplay.length > 3 && (
              <div className={dashboardStyles.viewAllContainer}>
                <button 
                  onClick={() => setShowAllExpense(!showAllExpense)}
                  className={dashboardStyles.viewAllButton}
                >
                  {showAllExpense ? (
                    <>
                      <ChevronUp className="w-5 h-5" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-5 h-5" />
                      View All Expenses ({expenseListForDisplay.length})
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Loading indicator ── */}
      {loading && (
        <div className="fixed bottom-6 right-6 bg-white shadow-lg rounded-2xl px-4 py-3 flex items-center gap-2 text-sm text-gray-600 border border-gray-100 z-40">
          <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
          Syncing…
        </div>
      )}

      {/* ── Add Transaction Modal ── */}
      <AddTransactionModal
        showModal={showModal}
        setShowModal={setShowModal}
        newTransaction={newTransaction}
        setNewTransaction={setNewTransaction}
        handleAddTransaction={handleAddTransaction}
        type="both"
        title="Add New Transaction"
        buttonText="Add Transaction"
        categories={[
          "Food", "Housing", "Transport", "Shopping", "Entertainment",
          "Utilities", "Healthcare", "Salary", "Freelance", "Investments", "Bonus", "Other"
        ]}
        color="teal"
      />

    </div>
  )
}

export default DashBoard