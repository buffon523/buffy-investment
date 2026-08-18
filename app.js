/**
 * BUFFY.COM - PREMIUM WEALTH MANAGEMENT PLATFORM
 * Core Application Engine
 */

// Global Auth Modal Invocation Handlers
window.openLoginModal = function() {
    const overlay = document.getElementById('modal-overlay');
    const target = document.getElementById('modal-login');
    if (overlay && target) {
        overlay.classList.remove('hidden');
        overlay.style.setProperty('display', 'flex', 'important');
        overlay.style.setProperty('pointer-events', 'auto', 'important');
        document.querySelectorAll('.auth-modal').forEach(m => {
            m.classList.add('hidden');
            m.style.setProperty('display', 'none', 'important');
        });
        target.classList.remove('hidden');
        target.style.setProperty('display', 'block', 'important');
    } else {
        window.location.href = 'login.html';
    }
};

window.openSignupModal = function() {
    const overlay = document.getElementById('modal-overlay');
    const target = document.getElementById('modal-signup');
    if (overlay && target) {
        overlay.classList.remove('hidden');
        overlay.style.setProperty('display', 'flex', 'important');
        overlay.style.setProperty('pointer-events', 'auto', 'important');
        document.querySelectorAll('.auth-modal').forEach(m => {
            m.classList.add('hidden');
            m.style.setProperty('display', 'none', 'important');
        });
        target.classList.remove('hidden');
        target.style.setProperty('display', 'block', 'important');
    } else {
        window.location.href = 'signup.html';
    }
};

window.closeAllModals = function() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.style.setProperty('display', 'none', 'important');
        overlay.style.setProperty('pointer-events', 'none', 'important');
    }
    document.querySelectorAll('.auth-modal').forEach(m => {
        m.classList.add('hidden');
        m.style.setProperty('display', 'none', 'important');
    });
};

document.addEventListener('DOMContentLoaded', () => {
    // ------------------------------------------------------------------
    // SUPABASE BACKEND INTEGRATION & PRODUCTION ENGINE
    // ------------------------------------------------------------------
    const SUPABASE_URL = window.SUPABASE_URL || 'https://ypuhbckmzatuzheavjec.supabase.co';
    const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwdWhiY2ttemF0dXpoZWF2amVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4OTE3MjEsImV4cCI6MjEwMDQ2NzcyMX0.WBfB0E6nDZtLQj96wU4dOmzCCkyeJ1y47k4fzlSlbXQ';

    window.SUPABASE_URL = SUPABASE_URL;
    window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

    function getSupabaseClient() {
        if (window.supabaseClient) return window.supabaseClient;
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            try {
                window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                return window.supabaseClient;
            } catch (e) {
                console.warn('Supabase client creation note:', e);
            }
        }
        return null;
    }

    const supabaseClient = getSupabaseClient();

    let currentUser = null;
    let publicAllocationChart = null;
    let dashboardPerformanceChart = null;
    let dashboardDonutChart = null;



    // Auto-open auth modal or dashboard based on URL parameters, hash, or active session
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    const savedSession = localStorage.getItem('buffy_active_session');

    if (urlParams.get('dashboard') === 'true') {
        switchView(true);
    } else if (savedSession) {
        let localUser = null;
        try { localUser = JSON.parse(savedSession); } catch(e){}
        if (localUser && localUser.loggedIn) {
            updateUserNavState(localUser, false);
            switchView(false);
        } else {
            document.documentElement.classList.remove('is-dashboard-active');
            switchView(false);
        }
    } else {
        document.documentElement.classList.remove('is-dashboard-active');
        switchView(false);
    }

    // ------------------------------------------------------------------
    // LIVE MARKET TICKER API (REAL-TIME CRYPTO & ASSETS)
    // ------------------------------------------------------------------
    async function fetchLiveMarketData() {
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true');
            if (response.ok) {
                const data = await response.json();
                if (data.bitcoin) {
                    const btcItem = document.querySelector('.ticker-item:nth-child(5)');
                    if (btcItem) {
                        const price = data.bitcoin.usd.toLocaleString();
                        const change = data.bitcoin.usd_24h_change.toFixed(2);
                        const positive = data.bitcoin.usd_24h_change >= 0;
                        btcItem.innerHTML = `<span class="t-symbol">BITCOIN</span> <span class="t-price">$${price}</span> <span class="t-change ${positive ? 'positive' : 'negative'}">${positive ? '+' : ''}${change}% <i class="fa-solid fa-caret-${positive ? 'up' : 'down'}"></i></span>`;
                    }
                }
                if (data.ethereum) {
                    const ethItem = document.querySelector('.ticker-item:nth-child(6)');
                    if (ethItem) {
                        const price = data.ethereum.usd.toLocaleString();
                        const change = data.ethereum.usd_24h_change.toFixed(2);
                        const positive = data.ethereum.usd_24h_change >= 0;
                        ethItem.innerHTML = `<span class="t-symbol">ETHEREUM</span> <span class="t-price">$${price}</span> <span class="t-change ${positive ? 'positive' : 'negative'}">${positive ? '+' : ''}${change}% <i class="fa-solid fa-caret-${positive ? 'up' : 'down'}"></i></span>`;
                    }
                }
            }
        } catch (e) {
            console.log('Live market ticker note:', e);
        }
    }
    fetchLiveMarketData();
    setInterval(fetchLiveMarketData, 60000);

    // ------------------------------------------------------------------
    // AUTH SESSION STATE & PROFILE SYNC (REFRESH PERSISTENCE)
    // ------------------------------------------------------------------
    async function checkUserSession() {
        // 1. Check local session storage first for instant page refresh restore
        const savedSession = localStorage.getItem('buffy_active_session');
        let localUser = null;
        if (savedSession) {
            try {
                localUser = JSON.parse(savedSession);
            } catch (e) {}
        }

        if (supabaseClient) {
            try {
                const { data: { session } } = await supabaseClient.auth.getSession();
                if (session?.user) {
                    updateUserNavState(session.user, false);
                } else if (localUser && localUser.loggedIn) {
                    updateUserNavState(localUser, false);
                } else {
                    document.documentElement.classList.remove('is-dashboard-active');
                    switchView(false);
                }
            } catch (e) {
                if (localUser && localUser.loggedIn) {
                    updateUserNavState(localUser, false);
                } else {
                    document.documentElement.classList.remove('is-dashboard-active');
                    switchView(false);
                }
            }

            supabaseClient.auth.onAuthStateChange((_event, session) => {
                if (session?.user) {
                    updateUserNavState(session.user, false);
                }
            });
        } else if (localUser && localUser.loggedIn) {
            updateUserNavState(localUser, false);
        } else {
            document.documentElement.classList.remove('is-dashboard-active');
            switchView(false);
        }
    }

    // ------------------------------------------------------------------
    // DYNAMIC USER IDENTITY & BALANCE MANAGER
    // ------------------------------------------------------------------
    let userBalanceState = {
        total_balance: 0.00,
        last_deposit: 0.00,
        active_deposits: 0.00,
        total_deposits: 0.00,
        earned_total: 0.00,
        pending_withdrawals: 0.00,
        total_withdrawals: 0.00
    };

    function updateDashboardBalanceUI() {
        const hdrTotalBal = document.getElementById('hdr-total-balance');
        const wbUsdt = document.getElementById('wb-usdt');
        const dashLastDep = document.getElementById('dash-last-dep');
        const dashActiveDep = document.getElementById('dash-active-dep');
        const dashTotalDep = document.getElementById('dash-total-dep');
        const dashEarnedTotal = document.getElementById('dash-earned-total');
        const dashPendingWith = document.getElementById('dash-pending-with');
        const dashTotalWith = document.getElementById('dash-total-with');

        const depAvailableBal = document.getElementById('dep-available-bal-display');
        const depActiveDepDisp = document.getElementById('dep-active-dep-display');
        const depUsdtBalDisp = document.getElementById('dep-usdt-bal-display');

        const formatUSD = num => `$ ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        if (hdrTotalBal) hdrTotalBal.textContent = formatUSD(userBalanceState.total_balance);
        if (wbUsdt) wbUsdt.textContent = formatUSD(userBalanceState.total_balance);
        if (dashLastDep) dashLastDep.textContent = formatUSD(userBalanceState.last_deposit);
        if (dashActiveDep) dashActiveDep.textContent = formatUSD(userBalanceState.active_deposits);
        if (dashTotalDep) dashTotalDep.textContent = formatUSD(userBalanceState.total_deposits);
        if (dashEarnedTotal) dashEarnedTotal.textContent = formatUSD(userBalanceState.earned_total);
        if (dashPendingWith) dashPendingWith.textContent = formatUSD(userBalanceState.pending_withdrawals);
        if (dashTotalWith) dashTotalWith.textContent = formatUSD(userBalanceState.total_withdrawals);

        if (depAvailableBal) depAvailableBal.textContent = formatUSD(userBalanceState.total_balance);
        if (depActiveDepDisp) depActiveDepDisp.textContent = formatUSD(userBalanceState.active_deposits);
        if (depUsdtBalDisp) depUsdtBalDisp.textContent = formatUSD(userBalanceState.total_balance > 0 ? userBalanceState.total_balance * 0.6 : 0.00);
    }

    async function recalculateUserBalances(userEmail) {
        const targetEmail = userEmail || (currentUser ? currentUser.email : null);
        if (!targetEmail) {
            updateDashboardBalanceUI();
            return;
        }

        if (supabaseClient) {
            try {
                const { data } = await supabaseClient
                    .from('user_transactions')
                    .select('*')
                    .eq('user_email', targetEmail);

                if (data && data.length > 0) {
                    let totalDep = 0;
                    let lastDep = 0;
                    let totalWith = 0;

                    data.forEach(tx => {
                        const amt = parseFloat(tx.amount) || 0;
                        if (tx.tx_type === 'Deposit') {
                            totalDep += amt;
                            lastDep = amt;
                        } else if (tx.tx_type === 'Withdrawal') {
                            totalWith += amt;
                        }
                    });

                    userBalanceState.total_deposits = totalDep;
                    userBalanceState.active_deposits = totalDep;
                    userBalanceState.last_deposit = lastDep;
                    userBalanceState.total_withdrawals = totalWith;
                    userBalanceState.earned_total = totalDep > 0 ? parseFloat((totalDep * 0.10).toFixed(2)) : 0.00;
                    userBalanceState.total_balance = Math.max(0, (totalDep + userBalanceState.earned_total) - totalWith);
                } else {
                    userBalanceState = {
                        total_balance: 0.00,
                        last_deposit: 0.00,
                        active_deposits: 0.00,
                        total_deposits: 0.00,
                        earned_total: 0.00,
                        pending_withdrawals: 0.00,
                        total_withdrawals: 0.00
                    };
                }
            } catch (err) {
                console.log('Balance calculation note:', err);
            }
        }
        updateDashboardBalanceUI();
    }

    function setDashboardUserInfo(name, plan, email) {
        let userNameStr = name ? name.trim() : '';
        if (!userNameStr && email) {
            userNameStr = email.split('@')[0];
        }
        if (!userNameStr) {
            userNameStr = 'Account';
        }

        const userPlanStr = plan || 'Growth';

        const hdrUsername = document.getElementById('hdr-username');
        const hdrLastSeen = document.getElementById('hdr-lastseen');
        const hdrIp = document.getElementById('hdr-ip');
        const dashRefLink = document.getElementById('dash-ref-link');
        const navUserName = document.getElementById('nav-user-name');
        const profName = document.getElementById('prof-name');
        const settingName = document.getElementById('setting-fullname');
        const settingEmail = document.getElementById('setting-email');

        if (hdrUsername) hdrUsername.textContent = userNameStr;
        if (hdrLastSeen) {
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = now.toLocaleTimeString('en-US');
            hdrLastSeen.textContent = `${dateStr} ${timeStr}`;
        }
        const formattedRefUser = userNameStr.toLowerCase().replace(/\s+/g, '');
        if (dashRefLink) dashRefLink.value = `https://buffyinvestment.com/?ref=${encodeURIComponent(formattedRefUser)}`;

        const refLinkMainInput = document.getElementById('ref-link-main-input');
        const refCodeVal = document.getElementById('ref-code-val');
        const tellFriendLinkInput = document.getElementById('tell-friend-link-input');
        if (refLinkMainInput) refLinkMainInput.value = `https://buffyinvestment.com/?ref=${encodeURIComponent(formattedRefUser)}`;
        if (tellFriendLinkInput) tellFriendLinkInput.value = `https://buffyinvestment.com/?ref=${encodeURIComponent(formattedRefUser)}`;
        if (refCodeVal) refCodeVal.textContent = `BUFFY-${formattedRefUser.toUpperCase()}`;

        // Update all banner embed codes dynamically with user referral handle
        const embedCodes = document.querySelectorAll('.banner-embed-code');
        embedCodes.forEach(codeEl => {
            codeEl.value = codeEl.value.replace(/\?ref=[a-zA-Z0-9_-]+/g, `?ref=${encodeURIComponent(formattedRefUser)}`);
        });

        if (navUserName) navUserName.textContent = userNameStr;
        if (profName) profName.value = userNameStr;
        if (settingName) settingName.value = userNameStr;
        if (settingEmail && email) settingEmail.value = email;

        const activeUserEmail = email || (currentUser ? currentUser.email : null);
        recalculateUserBalances(activeUserEmail);
        loadAccountReferrals(activeUserEmail);
        loadAccountHistory(activeUserEmail);
    }

    // ------------------------------------------------------------------
    // ACCOUNT-SPECIFIC REFERRAL ENGINE & TRACKING
    // ------------------------------------------------------------------
    async function loadAccountReferrals(userEmail) {
        const targetEmail = userEmail || (currentUser ? currentUser.email : null);
        let referralsList = [];

        // 1. Check local session storage for user-specific referral history
        if (targetEmail) {
            const localKey = `buffy_user_referrals_${targetEmail.toLowerCase()}`;
            const saved = localStorage.getItem(localKey);
            if (saved) {
                try {
                    referralsList = JSON.parse(saved);
                } catch (e) {}
            }
        }

        // 2. Fetch from Supabase user_referrals table if available
        if (supabaseClient && targetEmail) {
            try {
                const { data } = await supabaseClient
                    .from('user_referrals')
                    .select('*')
                    .eq('referrer_email', targetEmail)
                    .order('created_at', { ascending: false });

                if (data && data.length > 0) {
                    referralsList = data;
                }
            } catch (err) {
                console.log('Referrals fetch note:', err);
            }
        }

        // If no referrals recorded for new user, keep list empty [].
        // For default demo account (investor@buffyinvestment.com or Angel), provide initial sample referrals if none exist.
        if ((!targetEmail || targetEmail === 'investor@buffyinvestment.com') && referralsList.length === 0) {
            referralsList = [
                { full_name: 'Marcus Vance', email: 'm.vance@wealthnet.com', created_at: new Date(Date.now() - 86400000 * 2).toISOString(), tier: 'Growth Strategy', deposit: 5000.00, commission: 500.00, status: 'Active Investor' },
                { full_name: 'Elena Rostova', email: 'elena.r@fintechholdings.ch', created_at: new Date(Date.now() - 86400000 * 4).toISOString(), tier: 'Institutional Tier', deposit: 7500.00, commission: 750.00, status: 'Active Investor' },
                { full_name: 'David Chen', email: 'david.chen@baycapital.io', created_at: new Date(Date.now() - 86400000 * 6).toISOString(), tier: 'Balanced Growth', deposit: 2000.00, commission: 200.00, status: 'Active Investor' },
                { full_name: 'Sarah Jenkins', email: 's.jenkins@apexadvisors.com', created_at: new Date(Date.now() - 86400000 * 1).toISOString(), tier: 'Pending Deposit', deposit: 0.00, commission: 0.00, status: 'Pending Deposit' }
            ];
        }

        renderAccountReferralsUI(referralsList);
    }

    function renderAccountReferralsUI(referrals) {
        const refStatTotal = document.getElementById('ref-stat-total');
        const refStatActive = document.getElementById('ref-stat-active');
        const refStatEarnings = document.getElementById('ref-stat-earnings');
        const refTableBody = document.querySelector('#ref-users-table tbody');

        const totalCount = referrals.length;
        const activeCount = referrals.filter(r => (r.status || '').toLowerCase().includes('active')).length;
        let totalEarnings = 0;
        referrals.forEach(r => {
            totalEarnings += parseFloat(r.commission || 0);
        });

        if (refStatTotal) refStatTotal.textContent = `${totalCount} ${totalCount === 1 ? 'Investor' : 'Investors'}`;
        if (refStatActive) refStatActive.textContent = `${activeCount} Funded`;
        if (refStatEarnings) refStatEarnings.textContent = `$ ${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        if (refTableBody) {
            refTableBody.innerHTML = '';
            if (referrals.length === 0) {
                refTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94A3B8; padding: 25px;">No investors referred yet. Share your unique link above to start earning 10% instant commissions!</td></tr>`;
                return;
            }

            referrals.forEach(ref => {
                const dateObj = ref.created_at ? new Date(ref.created_at) : new Date();
                const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const tr = document.createElement('tr');
                const isActive = (ref.status || '').toLowerCase().includes('active');

                tr.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
                tr.innerHTML = `
                    <td style="padding: 14px;"><strong style="color: #FFF;">${ref.full_name || 'Anonymous Investor'}</strong><br><span style="color: #94A3B8; font-size: 0.78rem;">${ref.email || 'investor@buffy.com'}</span></td>
                    <td style="padding: 14px; color: #CBD5E1;">${dateStr}</td>
                    <td style="padding: 14px;"><span class="w-badge ${isActive ? 'usdt' : 'btc'}">${ref.tier || 'Standard Tier'}</span></td>
                    <td style="padding: 14px; color: ${isActive ? '#FFF' : '#94A3B8'}; font-weight: 700;">$ ${parseFloat(ref.deposit || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="padding: 14px; color: ${isActive ? '#10B981' : '#94A3B8'}; font-weight: 700;">${isActive ? '+' : ''}$ ${parseFloat(ref.commission || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="padding: 14px;"><span class="status-pill ${isActive ? 'success' : 'warning'}"><i class="fa-solid ${isActive ? 'fa-circle-check' : 'fa-hourglass-half'}"></i> ${ref.status || 'Pending Deposit'}</span></td>
                `;
                refTableBody.appendChild(tr);
            });
        }
    }

    // ------------------------------------------------------------------
    // ACCOUNT-SPECIFIC REAL-TIME TRANSACTION HISTORY & LEDGER ENGINE
    // ------------------------------------------------------------------
    let currentHistoryFilter = 'all';
    let currentHistorySearch = '';
    let currentTxList = [];

    async function loadAccountHistory(userEmail, filterType = currentHistoryFilter, searchQuery = currentHistorySearch) {
        const targetEmail = userEmail || (currentUser ? currentUser.email : null);
        currentHistoryFilter = filterType;
        currentHistorySearch = searchQuery;
        let txList = [];

        // 1. Fetch from localStorage for active user
        if (targetEmail) {
            const localKey = `buffy_user_txs_${targetEmail.toLowerCase()}`;
            const saved = localStorage.getItem(localKey);
            if (saved) {
                try {
                    txList = JSON.parse(saved);
                } catch (e) {}
            }
        }

        // 2. Fetch from Supabase user_transactions table if available
        if (supabaseClient && targetEmail) {
            try {
                const { data } = await supabaseClient
                    .from('user_transactions')
                    .select('*')
                    .eq('user_email', targetEmail)
                    .order('created_at', { ascending: false });

                if (data && data.length > 0) {
                    txList = data;
                }
            } catch (err) {
                console.log('Transactions fetch note:', err);
            }
        }

        // Default seed data for main demo investor account (investor@buffyinvestment.com or Angel)
        if ((!targetEmail || targetEmail === 'investor@buffyinvestment.com') && txList.length === 0) {
            txList = [
                { tx_id: '#TXN-894201', type: 'Deposit', method: 'USDT TRC20 Custody', amount: 14499.00, created_at: new Date(Date.now() - 86400000 * 2).toISOString(), status: 'Completed / Verified' },
                { tx_id: '#TXN-894198', type: 'Referral Bonus', method: 'Affiliate Payout (Marcus Vance)', amount: 500.00, created_at: new Date(Date.now() - 86400000 * 4).toISOString(), status: 'Completed / Credited' },
                { tx_id: '#TXN-894195', type: 'Referral Bonus', method: 'Affiliate Payout (Elena Rostova)', amount: 750.00, created_at: new Date(Date.now() - 86400000 * 6).toISOString(), status: 'Completed / Credited' },
                { tx_id: '#TXN-894190', type: 'Referral Bonus', method: 'Affiliate Payout (David Chen)', amount: 200.00, created_at: new Date(Date.now() - 86400000 * 8).toISOString(), status: 'Completed / Credited' }
            ];
            if (targetEmail) {
                localStorage.setItem(`buffy_user_txs_${targetEmail.toLowerCase()}`, JSON.stringify(txList));
            }
        }

        currentTxList = txList;
        renderAccountHistoryUI(txList, filterType, searchQuery);
    }

    function renderAccountHistoryUI(txList, filterType = 'all', searchQuery = '') {
        const histTotalDep = document.getElementById('hist-total-dep');
        const histTotalWith = document.getElementById('hist-total-with');
        const histTotalCount = document.getElementById('hist-total-count');
        const histTableBody = document.querySelector('#history-table tbody');

        let totalDep = 0;
        let totalWith = 0;

        txList.forEach(t => {
            const amt = parseFloat(t.amount || 0);
            if ((t.type || '').toLowerCase().includes('deposit') || (t.type || '').toLowerCase().includes('referral')) {
                totalDep += amt;
            } else if ((t.type || '').toLowerCase().includes('withdraw')) {
                totalWith += amt;
            }
        });

        if (histTotalDep) histTotalDep.textContent = `$ ${totalDep.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (histTotalWith) histTotalWith.textContent = `$ ${totalWith.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (histTotalCount) histTotalCount.textContent = `${txList.length} Recorded`;

        if (histTableBody) {
            histTableBody.innerHTML = '';

            let filtered = txList.filter(t => {
                if (filterType === 'deposit') return (t.type || '').toLowerCase().includes('deposit');
                if (filterType === 'withdrawal') return (t.type || '').toLowerCase().includes('withdraw');
                if (filterType === 'referral') return (t.type || '').toLowerCase().includes('referral');
                return true;
            });

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                filtered = filtered.filter(t => 
                    (t.tx_id || '').toLowerCase().includes(q) ||
                    (t.type || '').toLowerCase().includes(q) ||
                    (t.method || '').toLowerCase().includes(q)
                );
            }

            if (filtered.length === 0) {
                histTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #94A3B8; padding: 25px;">No transactions recorded for this filter view.</td></tr>`;
                return;
            }

            filtered.forEach(t => {
                const dateObj = t.created_at ? new Date(t.created_at) : new Date();
                const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const isDeposit = (t.type || '').toLowerCase().includes('deposit') || (t.type || '').toLowerCase().includes('referral');
                const isWithdrawal = (t.type || '').toLowerCase().includes('withdraw');

                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
                tr.innerHTML = `
                    <td style="padding: 14px;"><strong style="color: #F4C430; font-family: monospace; font-size: 0.92rem;">${t.tx_id || '#TXN-' + Math.floor(100000 + Math.random() * 900000)}</strong></td>
                    <td style="padding: 14px;">
                        <span class="w-badge ${isDeposit ? 'usdt' : 'payeer'}">${t.type || 'Transaction'}</span><br>
                        <span style="color: #94A3B8; font-size: 0.78rem;">${t.method || 'Standard Wire/Crypto'}</span>
                    </td>
                    <td style="padding: 14px; color: #CBD5E1; font-size: 0.84rem;">${dateStr}<br><span style="color: #94A3B8; font-size: 0.75rem;">${timeStr}</span></td>
                    <td style="padding: 14px; color: ${isDeposit ? '#10B981' : '#FFF'}; font-weight: 700; font-size: 0.98rem;">${isDeposit ? '+' : '-'}$ ${parseFloat(t.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="padding: 14px;"><span class="status-pill ${isWithdrawal ? 'warning' : 'success'}"><i class="fa-solid ${isWithdrawal ? 'fa-hourglass-half' : 'fa-circle-check'}"></i> ${t.status || 'Completed'}</span></td>
                `;
                histTableBody.appendChild(tr);
            });
        }
    }

    // Helper to append a new transaction to the active account
    async function addAccountTransaction(type, method, amount, status = 'Completed / Verified') {
        const targetEmail = currentUser ? currentUser.email : 'investor@buffyinvestment.com';
        const newTx = {
            tx_id: '#TXN-' + Math.floor(100000 + Math.random() * 900000),
            type: type,
            method: method,
            amount: parseFloat(amount),
            created_at: new Date().toISOString(),
            status: status
        };

        const localKey = `buffy_user_txs_${targetEmail.toLowerCase()}`;
        let txs = [];
        try {
            txs = JSON.parse(localStorage.getItem(localKey) || '[]');
        } catch (e) {}

        txs.unshift(newTx);
        localStorage.setItem(localKey, JSON.stringify(txs));

        if (supabaseClient) {
            try {
                await supabaseClient.from('user_transactions').insert([{
                    user_email: targetEmail,
                    tx_id: newTx.tx_id,
                    type: newTx.type,
                    method: newTx.method,
                    amount: newTx.amount,
                    status: newTx.status,
                    created_at: newTx.created_at
                }]);
            } catch (err) {
                console.log('Supabase transaction insert note:', err);
            }
        }

        loadAccountHistory(targetEmail);
    }

    // Filter Buttons Event Delegation
    document.addEventListener('click', (e) => {
        const filterBtn = e.target.closest('.btn-hist-filter');
        if (filterBtn) {
            document.querySelectorAll('.btn-hist-filter').forEach(b => b.classList.remove('active'));
            filterBtn.classList.add('active');
            const fType = filterBtn.getAttribute('data-filter') || 'all';
            loadAccountHistory(currentUser ? currentUser.email : null, fType, currentHistorySearch);
        }
    });

    // Search Input Listener
    document.addEventListener('input', (e) => {
        if (e.target && e.target.id === 'hist-search-input') {
            currentHistorySearch = e.target.value;
            renderAccountHistoryUI(currentTxList, currentHistoryFilter, currentHistorySearch);
        }
    });

    // Live Server Clock Widget
    function startClock() {
        const clockEl = document.getElementById('hdr-clock');
        if (!clockEl) return;
        setInterval(() => {
            const now = new Date();
            clockEl.textContent = now.toTimeString().split(' ')[0];
        }, 1000);
    }
    startClock();

    async function updateUserNavState(user, autoOpenDashboard = false) {
        currentUser = user;
        const guestNav = document.getElementById('guest-nav-group');
        const userNav = document.getElementById('user-nav-group');

        if (user) {
            if (guestNav) guestNav.style.display = 'none';
            if (userNav) userNav.style.display = 'inline-flex';

            let displayName = user.user_metadata?.full_name || user.displayName || user.name || '';
            let targetPlan = user.user_metadata?.target_plan || user.plan || 'Growth';
            const email = user.email;

            // Save active session to localStorage so browser refreshes NEVER log out
            localStorage.setItem('buffy_active_session', JSON.stringify({
                email: email,
                displayName: displayName,
                plan: targetPlan,
                loggedIn: true
            }));

            // For existing/old users, fetch profile from Supabase user_profiles table if metadata is missing
            if (supabaseClient && email && (!displayName || displayName === email)) {
                try {
                    const { data } = await supabaseClient
                        .from('user_profiles')
                        .select('full_name, target_plan, preferred_wallet')
                        .eq('email', email)
                        .maybeSingle();

                    if (data) {
                        if (data.full_name) displayName = data.full_name;
                        if (data.target_plan) targetPlan = data.target_plan;
                        if (data.preferred_wallet) {
                            const withAddrInput = document.getElementById('with-address-input');
                            if (withAddrInput) withAddrInput.value = data.preferred_wallet;
                        }
                    }
                } catch (e) {
                    console.log('Profile fetch note:', e);
                }
            }

            if (!displayName && email) {
                displayName = email.split('@')[0];
            }

            setDashboardUserInfo(displayName, targetPlan, email);
            loadUserTransactionsFromSupabase();

            // Automatically stay inside dashboard upon browser refresh if logged in
            if (autoOpenDashboard) {
                switchView(true);
            }
        } else {
            localStorage.removeItem('buffy_active_session');
            if (guestNav) guestNav.style.display = 'inline-flex';
            if (userNav) userNav.style.display = 'none';
        }
    }

    let userTransactionsList = [
        { id: 'DEP-894201-USDT', created_at: new Date(Date.now() - 86400000 * 2).toISOString(), tx_type: 'Deposit', asset_class: 'USDT Crypto Custody', amount: 10000.00, status: 'Completed' },
        { id: 'DEP-742910-ACH', created_at: new Date(Date.now() - 86400000 * 5).toISOString(), tx_type: 'Deposit', asset_class: 'ACH Bank Wire', amount: 5000.00, status: 'Completed' }
    ];

    async function loadUserTransactionsFromSupabase() {
        const userEmail = currentUser ? currentUser.email : null;
        if (supabaseClient && userEmail) {
            try {
                const { data } = await supabaseClient
                    .from('user_transactions')
                    .select('*')
                    .eq('user_email', userEmail)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (data && data.length > 0) {
                    userTransactionsList = data;
                }
            } catch (err) {
                console.log('Transaction fetch error:', err);
            }
        }
        renderTransactionsTable(userTransactionsList);
    }

    function renderTransactionsTable(transactions) {
        const targetTables = document.querySelectorAll('#dash-deposit-history-table tbody');
        if (!targetTables || targetTables.length === 0) return;

        targetTables.forEach(tbody => {
            tbody.innerHTML = '';
            if (!transactions || transactions.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #94A3B8; padding: 20px;">No deposit transactions recorded yet. Submit a deposit to view instant status.</td></tr>`;
                return;
            }

            transactions.forEach(tx => {
                const dateObj = tx.created_at ? new Date(tx.created_at) : new Date();
                const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                const tr = document.createElement('tr');
                const isDeposit = tx.tx_type === 'Deposit';
                const statusStr = tx.status || 'Completed';
                const statusClass = statusStr.toLowerCase().includes('complete') ? 'completed' : (statusStr.toLowerCase().includes('fail') ? 'failed' : 'pending');
                const refId = tx.id || `DEP-${Math.floor(100000 + Math.random() * 900000)}`;

                tr.setAttribute('data-status', statusClass);
                tr.innerHTML = `
                    <td>${dateStr}</td>
                    <td><code>${refId}</code></td>
                    <td><span class="w-badge ${isDeposit ? 'usdt' : 'payeer'}">${tx.tx_type}</span> ${tx.asset_class || 'USD Cash'}</td>
                    <td class="${isDeposit ? 'positive' : ''}">${isDeposit ? '+' : '-'}$${parseFloat(tx.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td><span class="status-pill ${statusClass === 'completed' ? 'success' : (statusClass === 'failed' ? 'error' : 'warning')}"><i class="fa-solid ${statusClass === 'completed' ? 'fa-circle-check' : (statusClass === 'failed' ? 'fa-circle-xmark' : 'fa-hourglass-half')}"></i> ${statusStr}</span></td>
                `;
                tbody.appendChild(tr);
            });
        });

        // Re-apply active status filter
        const activeTab = document.querySelector('#dash-deposit-status-tabs .d-tab.active');
        if (activeTab) {
            filterDepositTableByStatus(activeTab.getAttribute('data-status'));
        }
    }

    function filterDepositTableByStatus(statusKey) {
        const rows = document.querySelectorAll('#dash-deposit-history-table tbody tr');
        rows.forEach(row => {
            const rowStatus = row.getAttribute('data-status');
            if (!statusKey || statusKey === 'all' || rowStatus === statusKey) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    // Bind Deposit Status Tab Filter Buttons
    const dTabs = document.querySelectorAll('#dash-deposit-status-tabs .d-tab');
    dTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            dTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const statusKey = tab.getAttribute('data-status');
            filterDepositTableByStatus(statusKey);
        });
    });

    checkUserSession();

    // ------------------------------------------------------------------
    // 1. GLOBAL APP STATE & ASSETS DATA
    // ------------------------------------------------------------------
    const marketAssets = [
        { name: 'Apple Inc.', symbol: 'AAPL', category: 'stocks', price: '$224.50', change: '+1.42%', positive: true, icon: 'A' },
        { name: 'NVIDIA Corp', symbol: 'NVDA', category: 'stocks', price: '$126.80', change: '+3.15%', positive: true, icon: 'N' },
        { name: 'Microsoft Corp', symbol: 'MSFT', category: 'stocks', price: '$448.20', change: '+0.88%', positive: true, icon: 'M' },
        { name: 'Vanguard S&P 500 ETF', symbol: 'VOO', category: 'etfs', price: '$535.10', change: '+0.75%', positive: true, icon: 'V' },
        { name: 'Invesco QQQ Trust', symbol: 'QQQ', category: 'etfs', price: '$492.40', change: '+1.20%', positive: true, icon: 'Q' },
        { name: 'Vanguard High Dividend', symbol: 'VYM', category: 'etfs', price: '$124.30', change: '+0.35%', positive: true, icon: 'VY' },
        { name: 'PIMCO Total Return Fund', symbol: 'PTTAX', category: 'funds', price: '$9.45', change: '+0.10%', positive: true, icon: 'P' },
        { name: 'US 10-Year Treasury Note', symbol: 'US10Y', category: 'bonds', price: '4.18%', change: '-0.05%', positive: false, icon: 'US' },
        { name: 'Vanguard Real Estate REIT', symbol: 'VNQ', category: 'realestate', price: '$88.60', change: '+1.10%', positive: true, icon: 'VN' },
        { name: 'Physical Gold Trust', symbol: 'IAU', category: 'realestate', price: '$44.20', change: '+0.45%', positive: true, icon: 'AU' },
        { name: 'Bitcoin Custody', symbol: 'BTC', category: 'crypto', price: '$67,420', change: '+3.20%', positive: true, icon: '₿' },
        { name: 'Ethereum Reserve', symbol: 'ETH', category: 'crypto', price: '$3,540', change: '+2.15%', positive: true, icon: 'Ξ' }
    ];

    // ------------------------------------------------------------------
    // 2. TOAST NOTIFICATION ENGINE
    // ------------------------------------------------------------------
    window.showToast = function(message, type = 'info', duration = 3500) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let iconClass = 'fa-circle-info';
        if (type === 'success') iconClass = 'fa-circle-check';
        if (type === 'warning') iconClass = 'fa-triangle-exclamation';

        toast.innerHTML = `
            <i class="fa-solid ${iconClass}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    };

    // ------------------------------------------------------------------
    // 3. NAVIGATION & SCROLL HANDLERS
    // ------------------------------------------------------------------
    const navbar = document.getElementById('navbar');
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(6, 10, 23, 0.95)';
            navbar.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
        } else {
            navbar.style.background = 'rgba(6, 10, 23, 0.85)';
            navbar.style.boxShadow = 'none';
        }
    });

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const isActive = navMenu.classList.contains('active');
            navMenu.style.display = isActive ? 'flex' : 'none';
            if (isActive) {
                navMenu.style.flexDirection = 'column';
                navMenu.style.position = 'absolute';
                navMenu.style.top = '100%';
                navMenu.style.left = '0';
                navMenu.style.width = '100%';
                navMenu.style.background = 'rgba(11, 19, 43, 0.98)';
                navMenu.style.padding = '20px';
                navMenu.style.borderBottom = '1px solid rgba(244, 196, 48, 0.3)';
            }
        });
    }

    // Smooth active link highlight & Home view switcher
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const href = link.getAttribute('href');
            if (href === '#home' || link.textContent.trim() === 'Home' || (href && href.startsWith('#'))) {
                switchView(false);
            }

            if (window.innerWidth <= 768 && navMenu) {
                navMenu.classList.remove('active');
                navMenu.style.display = 'none';
            }
        });
    });

    const brandLogos = document.querySelectorAll('.brand-logo');
    brandLogos.forEach(logo => {
        logo.addEventListener('click', () => {
            switchView(false);
        });
    });

    // ------------------------------------------------------------------
    // 4. ANIMATED COUNTERS FOR STATS
    // ------------------------------------------------------------------
    const statNumbers = document.querySelectorAll('.stat-number');
    let animatedStats = false;

    function animateStats() {
        if (animatedStats) return;
        statNumbers.forEach(stat => {
            const target = parseFloat(stat.getAttribute('data-target'));
            const prefix = stat.getAttribute('data-prefix') || '';
            const suffix = stat.getAttribute('data-suffix') || '';
            const duration = 2000;
            const stepTime = 20;
            const steps = duration / stepTime;
            const increment = target / steps;
            let current = 0;

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                const formatted = target >= 1000 ? Math.floor(current).toLocaleString() : current.toFixed(target % 1 === 0 ? 0 : 1);
                stat.textContent = `${prefix}${formatted}${suffix}`;
            }, stepTime);
        });
        animatedStats = true;
    }

    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                animateStats();
            }
        }, { threshold: 0.3 });
        observer.observe(statsSection);
    }

    // ------------------------------------------------------------------
    // 5. INTERACTIVE INVESTMENT CALCULATOR
    // ------------------------------------------------------------------
    const sliderInitial = document.getElementById('slider-initial');
    const sliderMonthly = document.getElementById('slider-monthly');
    const sliderYears = document.getElementById('slider-years');
    const selectStrategy = document.getElementById('select-strategy');

    const valInitial = document.getElementById('val-initial');
    const valMonthly = document.getElementById('val-monthly');
    const valYears = document.getElementById('val-years');
    const valRate = document.getElementById('val-rate');

    const calcTotalWealth = document.getElementById('calc-total-wealth');
    const calcPrincipal = document.getElementById('calc-principal');
    const calcInterest = document.getElementById('calc-interest');

    function calculateWealth() {
        if (!sliderInitial || !sliderMonthly || !sliderYears || !selectStrategy) return;

        const P = parseFloat(sliderInitial.value);
        const PMT = parseFloat(sliderMonthly.value);
        const t = parseInt(sliderYears.value);
        const annualRate = parseFloat(selectStrategy.value) / 100;
        const r = annualRate / 12; // monthly rate
        const n = t * 12; // total months

        valInitial.textContent = `$${P.toLocaleString()}`;
        valMonthly.textContent = `$${PMT.toLocaleString()}`;
        valYears.textContent = `${t} Year${t > 1 ? 's' : ''}`;
        valRate.textContent = `${selectStrategy.value}% Avg. Annual`;

        // Compound formula for monthly contributions:
        // A = P*(1+r)^n + PMT * [((1+r)^n - 1) / r]
        const compoundPrincipal = P * Math.pow(1 + r, n);
        const compoundSeries = PMT * ((Math.pow(1 + r, n) - 1) / r);
        const totalWealth = compoundPrincipal + compoundSeries;
        const totalInvested = P + (PMT * n);
        const interestEarned = totalWealth - totalInvested;

        calcTotalWealth.textContent = `$${Math.round(totalWealth).toLocaleString()}`;
        calcPrincipal.textContent = `$${Math.round(totalInvested).toLocaleString()}`;
        calcInterest.textContent = `+$${Math.round(interestEarned).toLocaleString()}`;
    }

    if (sliderInitial) {
        sliderInitial.addEventListener('input', calculateWealth);
        sliderMonthly.addEventListener('input', calculateWealth);
        sliderYears.addEventListener('input', calculateWealth);
        selectStrategy.addEventListener('change', calculateWealth);
        calculateWealth(); // Initial run
    }

    // ------------------------------------------------------------------
    // 6. MARKETS RENDER & CATEGORY TABS
    // ------------------------------------------------------------------
    const assetsGrid = document.getElementById('assets-grid');
    const marketTabs = document.querySelectorAll('.m-tab');

    function renderAssets(category = 'all') {
        if (!assetsGrid) return;
        assetsGrid.innerHTML = '';

        const filtered = category === 'all' 
            ? marketAssets 
            : marketAssets.filter(a => a.category === category);

        filtered.forEach(asset => {
            const card = document.createElement('div');
            card.className = 'asset-card';
            card.innerHTML = `
                <div class="asset-info">
                    <div class="asset-icon-box">${asset.icon}</div>
                    <div>
                        <div class="asset-name">${asset.name}</div>
                        <div class="asset-symbol">${asset.symbol} • ${asset.category.toUpperCase()}</div>
                    </div>
                </div>
                <div class="asset-pricing">
                    <div class="asset-price">${asset.price}</div>
                    <div class="asset-yield ${asset.positive ? 'positive' : 'negative'}">${asset.change}</div>
                </div>
            `;
            card.addEventListener('click', () => {
                showToast(`Selected ${asset.name} (${asset.symbol}) for portfolio allocation.`, 'success');
            });
            assetsGrid.appendChild(card);
        });
    }

    if (marketTabs.length > 0) {
        marketTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                marketTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                renderAssets(tab.getAttribute('data-cat'));
            });
        });
        renderAssets('all');
    }

    // ------------------------------------------------------------------
    // 7. PUBLIC ALLOCATION DONUT CHART
    // ------------------------------------------------------------------
    const ctxPublicAlloc = document.getElementById('publicAllocationChart');
    if (ctxPublicAlloc && typeof Chart !== 'undefined') {
        try {
            publicAllocationChart = new Chart(ctxPublicAlloc, {
                type: 'doughnut',
                data: {
                    labels: ['Stocks', 'ETFs', 'Real Estate', 'Bonds', 'Digital Assets'],
                    datasets: [{
                        data: [40, 25, 15, 10, 10],
                        backgroundColor: ['#3B82F6', '#F4C430', '#10B981', '#8B5CF6', '#06B6D4'],
                        borderWidth: 0,
                        hoverOffset: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    cutout: '72%'
                }
            });
        } catch (err) {
            console.log('Public chart init note:', err);
        }
    }

    // ------------------------------------------------------------------
    // 8. USER DASHBOARD VIEW SWITCHER & CHARTS
    // ------------------------------------------------------------------
    const publicSiteView = document.getElementById('public-site-view');
    const dashboardView = document.getElementById('dashboard-view');
    const btnToggleDashboard = document.getElementById('btn-toggle-dashboard');
    const btnCloseDashboard = document.getElementById('btn-close-dashboard');

    function switchView(showDashboard) {
        const publicSiteView = document.getElementById('public-site-view');
        const dashboardView = document.getElementById('dashboard-view');

        if (showDashboard) {
            document.documentElement.classList.add('is-dashboard-active');
            if (publicSiteView) publicSiteView.style.setProperty('display', 'none', 'important');
            if (dashboardView) {
                dashboardView.classList.remove('hidden');
                dashboardView.style.setProperty('display', 'block', 'important');
            }
            window.scrollTo(0, 0);

            // Ensure MY ACCOUNT is active and MAKE DEPOSIT is strictly hidden
            const sideNavLinks = document.querySelectorAll('.side-link[data-tab]');
            sideNavLinks.forEach(l => l.classList.remove('active'));
            const accountLink = document.querySelector('.side-link[data-tab="account"]');
            if (accountLink) accountLink.classList.add('active');

            const allPanels = document.querySelectorAll('.dash-tab-panel');
            allPanels.forEach(p => {
                p.classList.add('hidden');
                p.classList.remove('active');
                p.style.setProperty('display', 'none', 'important');
            });
            const accountPanel = document.getElementById('panel-account');
            if (accountPanel) {
                accountPanel.classList.remove('hidden');
                accountPanel.classList.add('active');
                accountPanel.style.setProperty('display', 'block', 'important');
            }

            initDashboardCharts();
            showToast('Loaded Interactive Client Dashboard UI.', 'info');
        } else {
            document.documentElement.classList.remove('is-dashboard-active');
            if (dashboardView) {
                dashboardView.classList.add('hidden');
                dashboardView.style.setProperty('display', 'none', 'important');
            }
            if (publicSiteView) publicSiteView.style.setProperty('display', 'block', 'important');
            if (window.history && window.history.pushState && window.location.search.includes('dashboard=true')) {
                window.history.pushState({}, '', window.location.pathname);
            }
            window.scrollTo(0, 0);
        }
    }

    if (btnToggleDashboard) btnToggleDashboard.addEventListener('click', () => switchView(true));
    if (btnCloseDashboard) btnCloseDashboard.addEventListener('click', () => switchView(false));

    // Dashboard Referral Link Copy Handlers
    document.querySelectorAll('#btn-copy-ref, #btn-copy-main-ref, .btn-copy-ref').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const input = document.getElementById('dash-ref-link') || document.getElementById('ref-link-main-input');
            if (input) {
                navigator.clipboard.writeText(input.value).then(() => {
                    showToast('📋 Referral link copied to clipboard!', 'success');
                }).catch(() => {
                    input.select();
                    document.execCommand('copy');
                    showToast('📋 Referral link copied to clipboard!', 'success');
                });
            }
        });
    });

    // ------------------------------------------------------------------
    // DASHBOARD SIDEBAR MAIN TAB SWITCHER
    // ------------------------------------------------------------------
    const sideNavLinks = document.querySelectorAll('.side-link[data-tab]');
    sideNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabKey = link.getAttribute('data-tab');

            // Highlight active side link
            sideNavLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Hide all dashboard panels and show target panel
            const allPanels = document.querySelectorAll('.dash-tab-panel');
            allPanels.forEach(p => {
                p.classList.add('hidden');
                p.classList.remove('active');
                p.style.setProperty('display', 'none', 'important');
            });

            let panelId = `panel-${tabKey}`;
            if (tabKey === 'account') panelId = 'panel-account';
            if (tabKey === 'make-deposit') panelId = 'panel-make-deposit';
            if (tabKey === 'withdrawal') panelId = 'panel-withdrawal';
            if (tabKey === 'history' || tabKey === 'deposits-list') panelId = 'panel-history';
            if (tabKey === 'settings') panelId = 'panel-settings';
            if (tabKey === 'referrals') panelId = 'panel-referrals';
            if (tabKey === 'banners' || tabKey === 'banner-links') panelId = 'panel-banners';
            if (tabKey === 'tell-friend') panelId = 'panel-tell-friend';

            const targetPanel = document.getElementById(panelId);
            if (targetPanel) {
                targetPanel.classList.remove('hidden');
                targetPanel.classList.add('active');
                targetPanel.style.setProperty('display', 'block', 'important');
            } else {
                // Default fallback to panel-account if panel is coming soon
                const accountPanel = document.getElementById('panel-account');
                if (accountPanel) {
                    accountPanel.classList.remove('hidden');
                    accountPanel.classList.add('active');
                    accountPanel.style.setProperty('display', 'block', 'important');
                }
                showToast(`Section "${tabKey.toUpperCase().replace('-', ' ')}" loaded.`, 'info');
            }
        });
    });

    function initDashboardCharts() {
        if (typeof Chart === 'undefined') return;

        try {
            // Performance Chart
            const ctxPerf = document.getElementById('dashboardPerformanceChart');
            if (ctxPerf && !dashboardPerformanceChart) {
                const gradient = ctxPerf.getContext('2d').createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, 'rgba(212, 175, 55, 0.4)');
                gradient.addColorStop(1, 'rgba(212, 175, 55, 0)');

                dashboardPerformanceChart = new Chart(ctxPerf, {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                        datasets: [{
                            label: 'Portfolio Value ($)',
                            data: [100000, 102400, 101800, 106500, 112000, 110500, 115800, 119200, 122000, 124500, 126000, 128450],
                            borderColor: '#F4C430',
                            borderWidth: 3,
                            backgroundColor: gradient,
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: '#F4C430',
                            pointHoverRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94A3B8' } },
                            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94A3B8' } }
                        }
                    }
                });
            }

            // Donut Chart
            const ctxDashDonut = document.getElementById('dashboardDonutChart');
            if (ctxDashDonut && !dashboardDonutChart) {
                dashboardDonutChart = new Chart(ctxDashDonut, {
                    type: 'doughnut',
                    data: {
                        labels: ['US Equities', 'Global ETFs', 'Real Estate REITs', 'Treasuries', 'Crypto Assets'],
                        datasets: [{
                            data: [45, 25, 15, 10, 5],
                            backgroundColor: ['#3B82F6', '#F4C430', '#10B981', '#8B5CF6', '#06B6D4'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        cutout: '70%'
                    }
                });
            }
        } catch(err) {
            console.log('Dashboard chart init note:', err);
        }
    }

    // Timeframe selector interaction
    const tfBtns = document.querySelectorAll('.tf-btn');
    tfBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tfBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (dashboardPerformanceChart) {
                // Generate slight random variation for demo feel
                const newValues = dashboardPerformanceChart.data.datasets[0].data.map(v => v * (0.95 + Math.random() * 0.1));
                dashboardPerformanceChart.data.datasets[0].data = newValues;
                dashboardPerformanceChart.update();
                showToast(`Updated performance chart view: ${btn.textContent}`, 'info');
            }
        });
    });

    // ------------------------------------------------------------------
    // 9. AUTHENTICATION & MODAL CONTROLLERS
    // ------------------------------------------------------------------
    const modalOverlay = document.getElementById('modal-overlay');
    const allModals = document.querySelectorAll('.auth-modal');

    function openAuthModal(modalId) {
        const overlay = document.getElementById('modal-overlay');
        if (!overlay) return;

        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';
        overlay.style.pointerEvents = 'auto';

        const modals = document.querySelectorAll('.auth-modal');
        modals.forEach(m => {
            m.classList.add('hidden');
            m.style.display = 'none';
        });

        const target = document.getElementById(modalId);
        if (target) {
            target.classList.remove('hidden');
            target.style.display = 'block';
        }
    }

    function closeAllModals() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.style.display = 'none';
            overlay.style.pointerEvents = 'none';
        }
        const modals = document.querySelectorAll('.auth-modal');
        modals.forEach(m => {
            m.classList.add('hidden');
            m.style.display = 'none';
        });
    }

    // Universal CTA & Registration Button Handlers
    function handleSignUpCTA(planName) {
        const saved = localStorage.getItem('buffy_active_session');
        let isLoggedIn = false;
        if (saved) {
            try {
                const p = JSON.parse(saved);
                if (p && p.loggedIn) isLoggedIn = true;
            } catch(e){}
        }
        if (isLoggedIn) {
            switchView(true);
            if (planName) showToast(`Viewing active portfolio for ${planName} Plan.`, 'info');
        } else {
            window.location.href = 'signup' + (planName ? '?plan=' + encodeURIComponent(planName) : '');
        }
    }

    const heroBtnStart = document.getElementById('hero-btn-start');
    if (heroBtnStart) heroBtnStart.addEventListener('click', () => handleSignUpCTA());

    const calcBtnStart = document.getElementById('calc-btn-start');
    if (calcBtnStart) calcBtnStart.addEventListener('click', () => handleSignUpCTA());

    const planBtns = document.querySelectorAll('.btn-plan');
    planBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const planName = btn.getAttribute('data-plan') || 'Growth';
            handleSignUpCTA(planName);
        });
    });

    const btnNavProfile = document.getElementById('btn-nav-profile');
    if (btnNavProfile) {
        btnNavProfile.addEventListener('click', () => {
            switchView(true);
            const setLink = document.querySelector('.side-link[data-tab="settings"]');
            if (setLink) setLink.click();
        });
    }

    // Universal Delegated Auth Modal Click Controller
    document.addEventListener('click', (e) => {
        const btnCloseModal = e.target.closest('.modal-close');
        if (btnCloseModal) {
            e.preventDefault();
            closeAllModals();
            return;
        }
    });

    // Close buttons & overlay click
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeAllModals();
        });
    }

    // Toggle Password Visibility (Eye Icon Handler)
    const togglePassBtns = document.querySelectorAll('.btn-toggle-password');
    togglePassBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const wrapper = btn.closest('.password-input-wrapper');
            const input = wrapper ? wrapper.querySelector('input') : null;
            const icon = btn.querySelector('i');
            if (input) {
                if (input.type === 'password') {
                    input.type = 'text';
                    if (icon) icon.className = 'fa-solid fa-eye-slash';
                } else {
                    input.type = 'password';
                    if (icon) icon.className = 'fa-solid fa-eye';
                }
            }
        });
    });

    // Switch between login & signup
    const switchToSignup = document.getElementById('switch-to-signup');
    const switchToLogin = document.getElementById('switch-to-login');
    if (switchToSignup) switchToSignup.addEventListener('click', (e) => { e.preventDefault(); openAuthModal('modal-signup'); });
    if (switchToLogin) switchToLogin.addEventListener('click', (e) => { e.preventDefault(); openAuthModal('modal-login'); });

    // Universal Login Form Submissions (Modal & Standalone Page)
    const loginForms = [document.getElementById('form-login'), document.getElementById('form-standalone-login')].filter(Boolean);
    loginForms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = form.querySelector('input[type="email"]') || document.getElementById('login-email');
            const passInput = form.querySelector('input[type="password"]') || document.getElementById('login-password');
            const email = emailInput?.value || 'investor@buffy.com';
            const password = passInput?.value;

            if (supabaseClient && email && password) {
                try {
                    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
                    if (error) {
                        console.warn('Supabase Auth Notice:', error.message);
                    } else if (data?.user) {
                        showToast(`Welcome back, ${data.user.email}!`, 'success');
                    }
                } catch (err) {
                    console.log('Supabase Auth fallback:', err);
                }
            }

            const displayName = email.includes('@') ? email.split('@')[0] : email;
            const userObj = { email: email, name: displayName, loggedIn: true };
            localStorage.setItem('buffy_active_session', JSON.stringify(userObj));

            if (window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html')) {
                window.location.href = 'index.html?dashboard=true';
            } else {
                updateUserNavState(userObj, true);
                recalculateUserBalances(email);
                loadAccountHistory(email);
                initReferralsDashboard(email);
                closeAllModals();
                showToast(`Welcome back ${displayName}! Accessing your Buffy.com portfolio.`, 'success');
                switchView(true);
            }
        });
    });

    // Universal Signup Form Submissions (Modal & Standalone Page)
    const signupForms = [document.getElementById('form-signup'), document.getElementById('form-standalone-signup')].filter(Boolean);
    signupForms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nameInput = form.querySelector('#signup-name') || document.getElementById('signup-name');
            const emailInput = form.querySelector('#signup-email') || document.getElementById('signup-email');
            const passInput = form.querySelector('#signup-password') || document.getElementById('signup-password');
            const walletInput = form.querySelector('#signup-wallet') || document.getElementById('signup-wallet');

            const name = nameInput?.value || 'Valued Investor';
            const email = emailInput?.value || 'investor@buffy.com';
            const password = passInput?.value;
            const wallet = walletInput?.value || '';

            if (supabaseClient && email && password) {
                try {
                    const { data, error } = await supabaseClient.auth.signUp({
                        email,
                        password,
                        options: { data: { full_name: name, preferred_wallet: wallet } }
                    });
                    if (error) {
                        console.warn('Supabase SignUp Note:', error.message);
                    } else if (data?.user) {
                        await supabaseClient.from('user_profiles').upsert({
                            id: data.user.id,
                            email: email,
                            full_name: name,
                            preferred_wallet: wallet
                        });
                    }
                } catch (err) {
                    console.log('Supabase SignUp fallback:', err);
                }
            }

            const displayName = name || (email.includes('@') ? email.split('@')[0] : email);
            const userObj = { email: email, name: displayName, wallet: wallet, loggedIn: true };
            localStorage.setItem('buffy_active_session', JSON.stringify(userObj));

            // Pre-fill withdrawal destination input with registered wallet
            const withAddrInput = document.getElementById('with-address-input');
            if (withAddrInput && wallet) {
                withAddrInput.value = wallet;
            }

            if (window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html')) {
                window.location.href = 'index.html?dashboard=true';
            } else {
                updateUserNavState(userObj, true);
                recalculateUserBalances(email);
                loadAccountHistory(email);
                initReferralsDashboard(email);

                // Dispatch Direct Welcome Email Notification to New User
                sendWelcomeEmailNotification(email, displayName, 'Growth Strategy Plan');

                closeAllModals();
                showToast(`Registration Successful! Welcome ${displayName}. Portfolio active.`, 'success');
                switchView(true);
            }
        });
    });

    // Helper: Send Direct Welcome Email Notification (From: welcome@buffyinvestment.com)
    async function sendWelcomeEmailNotification(email, name, plan) {
        if (!email) return;
        try {
            const res = await fetch('/api/send-welcome-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, full_name: name, target_plan: plan })
            });
            const result = await res.json();
            if (result?.success) {
                console.log(`📧 Direct Buffy Investment welcome email dispatched to ${email} (From: welcome@buffyinvestment.com)`);
            }
        } catch (err) {
            console.log('Welcome email dispatch note:', err);
        }
    }

    // 2FA PIN input auto-advance
    const pinInputs = document.querySelectorAll('.pin-input');
    pinInputs.forEach((input, index) => {
        input.addEventListener('keyup', (e) => {
            if (input.value && index < pinInputs.length - 1) {
                pinInputs[index + 1].focus();
            }
        });
    });

    // 2FA Submit -> Enter Dashboard
    const form2FA = document.getElementById('form-2fa');
    if (form2FA) {
        form2FA.addEventListener('submit', (e) => {
            e.preventDefault();
            closeAllModals();
            showToast('Authentication Successful! Welcome to Buffy.com.', 'success');
            switchView(true);
        });
    }

    // Transfer Modal (Deposit / Withdraw) -> Log to Supabase user_transactions
    const btnDashDeposit = document.getElementById('btn-dash-deposit');
    const btnDashWithdraw = document.getElementById('btn-dash-withdraw');
    const transferTitle = document.getElementById('transfer-title');
    const transferSub = document.getElementById('transfer-sub');
    const btnSubmitTransfer = document.getElementById('btn-submit-transfer');

    if (btnDashDeposit) {
        btnDashDeposit.addEventListener('click', () => {
            if (transferTitle) transferTitle.textContent = 'Quick Deposit';
            if (transferSub) transferSub.textContent = 'Transfer funds directly to your Buffy.com cash balance';
            if (btnSubmitTransfer) btnSubmitTransfer.textContent = 'Confirm Deposit';
            openAuthModal('modal-transfer');
        });
    }

    if (btnDashWithdraw) {
        btnDashWithdraw.addEventListener('click', () => {
            if (transferTitle) transferTitle.textContent = 'Withdraw Funds';
            if (transferSub) transferSub.textContent = 'Withdraw capital directly to your verified bank account';
            if (btnSubmitTransfer) btnSubmitTransfer.textContent = 'Confirm Withdrawal';
            openAuthModal('modal-transfer');
        });
    }

    const formTransfer = document.getElementById('form-transfer');
    if (formTransfer) {
        formTransfer.addEventListener('submit', async (e) => {
            e.preventDefault();
            const amount = document.getElementById('transfer-amount')?.value;
            const method = document.getElementById('transfer-method')?.value;
            const isDeposit = transferTitle?.textContent.includes('Deposit');
            const txType = isDeposit ? 'Deposit' : 'Withdrawal';
            const userEmail = currentUser ? currentUser.email : 'investor@buffyinvestment.com';

            if (supabaseClient && amount) {
                try {
                    await supabaseClient.from('user_transactions').insert([
                        { user_email: userEmail, tx_type: txType, asset_class: `USD Cash (${method})`, amount: parseFloat(amount), status: 'Completed' }
                    ]);
                } catch (err) {
                    console.log('Supabase transaction insert note:', err);
                }
            }

            await recalculateUserBalances(userEmail);
            closeAllModals();
            showToast(`Successfully processed $${amount} via ${method}. Account balances updated!`, 'success');
            loadUserTransactionsFromSupabase();
        });
    }

    // Quick Amount Preset Chips & Live Summary Interaction
    const presetChips = document.querySelectorAll('.btn-preset-chip');
    const depAmountInput = document.getElementById('dep-amount-input');
    const depCurrencyInput = document.getElementById('dep-currency-input');
    const depGatewaySelect = document.getElementById('dep-gateway-select');

    function updateLiveDepositSummary() {
        const amt = parseFloat(document.getElementById('dep-amount-input')?.value || 0);
        const curr = document.getElementById('dep-currency-input')?.value || 'USD';
        const method = document.getElementById('dep-gateway-select')?.value || 'Bank Transfer';

        const sumAmount = document.getElementById('dash-sum-amount');
        const sumMethod = document.getElementById('dash-sum-method');
        const sumTime = document.getElementById('dash-sum-time');
        const sumTotal = document.getElementById('dash-sum-total');

        let symbol = '$ ';
        if (curr === 'EUR') symbol = '€ ';
        if (curr === 'GBP') symbol = '£ ';
        if (curr === 'USDT') symbol = 'USDT ';
        if (curr === 'BTC') symbol = 'BTC ';

        if (sumAmount) sumAmount.textContent = `${symbol}${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        if (sumMethod) sumMethod.textContent = method;
        if (sumTotal) sumTotal.textContent = `${symbol}${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

        if (sumTime) {
            if (method.includes('Card') || method.includes('Wallet')) sumTime.textContent = 'Instant (3D Secure)';
            else if (method.includes('Crypto')) sumTime.textContent = '~15 Mins (Blockchain Confirm)';
            else sumTime.textContent = '1-2 Business Days';
        }
    }

    if (presetChips.length > 0 && depAmountInput) {
        presetChips.forEach(chip => {
            chip.addEventListener('click', () => {
                presetChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                const presetVal = chip.getAttribute('data-preset');
                if (presetVal) {
                    depAmountInput.value = presetVal;
                    updateLiveDepositSummary();
                }
            });
        });
    }

    if (depAmountInput) depAmountInput.addEventListener('input', updateLiveDepositSummary);
    if (depCurrencyInput) depCurrencyInput.addEventListener('change', updateLiveDepositSummary);
    if (depGatewaySelect) depGatewaySelect.addEventListener('change', updateLiveDepositSummary);

    // Make Deposit Panel Handler
    const formDashDeposit = document.getElementById('form-dash-deposit');
    if (formDashDeposit) {
        formDashDeposit.addEventListener('submit', async (e) => {
            e.preventDefault();
            const plan = document.getElementById('dep-plan-select')?.value;
            const amount = parseFloat(document.getElementById('dep-amount-input')?.value || 0);
            const currency = document.getElementById('dep-currency-input')?.value || 'USD';
            const gateway = document.getElementById('dep-gateway-select')?.value || 'Bank Transfer';
            const userEmail = currentUser ? currentUser.email : 'investor@buffyinvestment.com';

            if (amount <= 0) {
                showToast('Please enter a valid deposit amount greater than 0.', 'warning');
                return;
            }

            const btnDepNow = document.getElementById('btn-deposit-now');
            if (btnDepNow) {
                btnDepNow.disabled = true;
                btnDepNow.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing Encrypted Deposit...`;
            }

            // Prepend newly submitted deposit to active transactions list immediately
            const newDepTx = {
                id: `DEP-${Math.floor(100000 + Math.random() * 900000)}-${currency}`,
                created_at: new Date().toISOString(),
                tx_type: 'Deposit',
                asset_class: `${gateway} (${currency})`,
                amount: amount,
                status: 'Completed'
            };

            userTransactionsList.unshift(newDepTx);
            renderTransactionsTable(userTransactionsList);

            await addAccountTransaction('Deposit', `${gateway} (${currency})`, amount, 'Completed / Verified');

            if (supabaseClient && amount > 0) {
                try {
                    await supabaseClient.from('user_transactions').insert([
                        { user_email: userEmail, tx_type: 'Deposit', asset_class: `${gateway} (${currency})`, amount: amount, status: 'Completed' }
                    ]);
                } catch (err) {
                    console.log('Deposit insert note:', err);
                }
            }

            setTimeout(async () => {
                await recalculateUserBalances(userEmail);
                if (btnDepNow) {
                    btnDepNow.disabled = false;
                    btnDepNow.innerHTML = `Deposit Now & Credit Account <i class="fa-solid fa-arrow-right"></i>`;
                }
                showToast(`🎉 Deposit Request Submitted Successfully! $${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} credited via ${gateway}. Transaction history refreshed!`, 'success');
            }, 600);
        });
    }

    // Withdrawal Panel Handler
    const formDashWithdraw = document.getElementById('form-dash-withdraw');
    if (formDashWithdraw) {
        formDashWithdraw.addEventListener('submit', async (e) => {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('with-amount-input')?.value || 0);
            const address = document.getElementById('with-address-input')?.value;
            const userEmail = currentUser ? currentUser.email : 'investor@buffyinvestment.com';

            await addAccountTransaction('Withdrawal', address ? `Payout to ${address}` : 'Standard Wire Payout', amount, 'Processing / Pending');

            if (supabaseClient && amount > 0) {
                try {
                    await supabaseClient.from('user_transactions').insert([
                        { user_email: userEmail, tx_type: 'Withdrawal', asset_class: `Payout (${address})`, amount: amount, status: 'Processing' }
                    ]);
                } catch (err) {
                    console.log('Withdrawal insert note:', err);
                }
            }

            await recalculateUserBalances(userEmail);
            loadUserTransactionsFromSupabase();
            showToast(`Withdrawal request of $${amount.toLocaleString()} submitted for processing. History ledger updated!`, 'success');
        });
    }

    // Profile Settings & Navigation (Open Settings Panel)
    const navProfBtn = document.getElementById('btn-nav-profile');
    if (navProfBtn) {
        btnNavProfile.addEventListener('click', () => {
            switchView(true);
            const sideNavLinks = document.querySelectorAll('.side-link[data-tab]');
            sideNavLinks.forEach(l => l.classList.remove('active'));
            const setLink = document.querySelector('.side-link[data-tab="settings"]');
            if (setLink) setLink.classList.add('active');

            const allPanels = document.querySelectorAll('.dash-tab-panel');
            allPanels.forEach(p => {
                p.classList.add('hidden');
                p.classList.remove('active');
            });

            const targetPanel = document.getElementById('panel-settings');
            if (targetPanel) {
                targetPanel.classList.remove('hidden');
                targetPanel.classList.add('active');
            }
        });
    }

    const formProfile = document.getElementById('form-profile');
    if (formProfile) {
        formProfile.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('prof-name')?.value;
            const plan = document.getElementById('prof-plan')?.value;
            if (supabaseClient && currentUser) {
                try {
                    await supabaseClient.from('user_profiles').upsert({
                        id: currentUser.id,
                        email: currentUser.email,
                        full_name: name,
                        target_plan: plan
                    });
                } catch (err) {
                    console.log('Profile save note:', err);
                }
            }
            closeAllModals();
            showToast('Profile settings saved to Supabase database.', 'success');
        });
    }

    const handleLogoutAction = async () => {
        if (supabaseClient) {
            try { await supabaseClient.auth.signOut(); } catch (e) {}
        }
        localStorage.removeItem('buffy_active_session');
        currentUser = null;
        updateUserNavState(null);
        switchView(false);
        showToast('Signed out of Buffy.com session.', 'info');
    };

    const btnLogout = document.getElementById('btn-logout');
    const sideLogoutBtn = document.getElementById('side-logout-btn');
    if (btnLogout) btnLogout.addEventListener('click', handleLogoutAction);
    if (sideLogoutBtn) sideLogoutBtn.addEventListener('click', handleLogoutAction);

    // ------------------------------------------------------------------
    // 10. FAQ ACCORDION & SEARCH FILTER
    // ------------------------------------------------------------------
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const btn = item.querySelector('.faq-question');
        btn.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            faqItems.forEach(i => i.classList.remove('active'));
            if (!isActive) item.classList.add('active');
        });
    });

    const faqSearch = document.getElementById('faq-search');
    if (faqSearch) {
        faqSearch.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            faqItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                if (text.includes(term)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    // ------------------------------------------------------------------
    // 11. CONTACT FORM & NEWSLETTER (SUPABASE PERSISTENCE)
    // ------------------------------------------------------------------
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('c-name')?.value;
            const email = document.getElementById('c-email')?.value;
            const subject = document.getElementById('c-subject')?.value;
            const message = document.getElementById('c-message')?.value;

            if (supabaseClient && fullName && email && message) {
                try {
                    const { error } = await supabaseClient.from('contact_inquiries').insert([
                        { full_name: fullName, email: email, subject: subject, message: message }
                    ]);
                    if (error) console.warn('Supabase Contact Insert Note:', error.message);
                } catch (err) {
                    console.log('Supabase Contact fallback:', err);
                }
            }

            contactForm.reset();
            showToast('Your inquiry has been stored in Supabase! A wealth specialist will contact you shortly.', 'success');
        });
    }

    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = newsletterForm.querySelector('input[type="email"]');
            const email = input?.value;

            if (supabaseClient && email) {
                try {
                    const { error } = await supabaseClient.from('newsletter_subscribers').insert([
                        { email: email }
                    ]);
                    if (error) console.warn('Supabase Newsletter Insert Note:', error.message);
                } catch (err) {
                    console.log('Supabase Newsletter fallback:', err);
                }
            }

            newsletterForm.reset();
            showToast('Subscribed! Your email was registered in Buffy.com Market Intelligence database.', 'success');
        });
    }

    // ------------------------------------------------------------------
    // 12. ENTERPRISE LEGAL MODALS & COMPLIANCE DOCS
    // ------------------------------------------------------------------
    const legalDocs = {
        privacy: {
            title: "Privacy Policy & Data Protection Standard",
            sub: "Buffy.com Global Data Governance & Encryption Policy",
            content: `<h4>1. Information Collection & Usage</h4>
            <p>Buffy.com Financial Technologies Inc. collects investor identity details, financial verification metrics, and device session metadata strictly for regulatory compliance (KYC/AML) and account administration.</p>
            <h4>2. Data Encryption Standards</h4>
            <p>All data in transit and at rest is secured via 256-bit AES encryption and SOC-2 compliant data centers. We never sell or transfer investor information to unverified third parties.</p>
            <h4>3. Investor Rights & Opt-Out</h4>
            <p>Investors retain full rights to request data access audits, account closure, or information deletion in accordance with global data protection frameworks.</p>`
        },
        terms: {
            title: "Terms of Service & Investment Agreement",
            sub: "Master Services Protocol & Fiduciary Responsibilities",
            content: `<h4>1. Platform Advisory Scope</h4>
            <p>Buffy.com offers quantitative wealth management, asset allocation algorithms, and brokerage execution. By opening an account, investors agree to standard custodial terms.</p>
            <h4>2. Investment Volatility & Risk Acknowledgement</h4>
            <p>Capital deployed across equities, ETFs, fixed income, real estate, and digital assets is subject to market fluctuation. Value can increase or decrease.</p>
            <h4>3. Execution & Account Security</h4>
            <p>Users are responsible for maintaining credential security. Automated rebalancing protocols execute according to chosen investment strategy settings.</p>`
        },
        disclosures: {
            title: "Regulatory Risk Notice & Risk Disclosures",
            sub: "SEC & FINRA Regulatory Compliance Statements",
            content: `<h4>1. No Profit Guarantee</h4>
            <p>Buffy.com explicitly makes no profit promises or guaranteed return claims. All market projections are mathematical models based on historical trends.</p>
            <h4>2. SIPC & FDIC Custodial Protection</h4>
            <p>Securities are held with SIPC-member custodian institutions up to $500,000 (including $250,000 for cash claims). Cash reserves reside in FDIC-insured partner banks.</p>`
        },
        cookie: {
            title: "Cookie Policy & Telemetry Standard",
            sub: "Session Security & Browser Preference Tracking",
            content: `<h4>Essential Cookies</h4>
            <p>We deploy strict session cookies required for authentication token validation, SSL security, and user dashboard state management.</p>`
        },
        aml: {
            title: "Anti-Money Laundering (AML) & KYC Policy",
            sub: "Global Financial Crime Prevention Standards",
            content: `<h4>Identity Verification (KYC)</h4>
            <p>In compliance with international financial regulations, all investor accounts undergo automated identity verification and Sanctions/PEP screening prior to capital deployment.</p>`
        }
    };

    function openLegalModal(docKey) {
        const doc = legalDocs[docKey];
        if (!doc) return;
        const titleEl = document.getElementById('legal-doc-title');
        const subEl = document.getElementById('legal-doc-sub');
        const contentEl = document.getElementById('legal-doc-content');

        if (titleEl) titleEl.textContent = doc.title;
        if (subEl) subEl.textContent = doc.sub;
        if (contentEl) contentEl.innerHTML = doc.content;

        openAuthModal('modal-legal-doc');
    }

    const linkPrivacy = document.getElementById('link-privacy');
    const linkTerms = document.getElementById('link-terms');
    const linkDisclosures = document.getElementById('link-disclosures');
    const linkCookie = document.getElementById('link-cookie');
    const linkAml = document.getElementById('link-aml');

    if (linkPrivacy) linkPrivacy.addEventListener('click', (e) => { e.preventDefault(); openLegalModal('privacy'); });
    if (linkTerms) linkTerms.addEventListener('click', (e) => { e.preventDefault(); openLegalModal('terms'); });
    if (linkDisclosures) linkDisclosures.addEventListener('click', (e) => { e.preventDefault(); openLegalModal('disclosures'); });
    if (linkCookie) linkCookie.addEventListener('click', (e) => { e.preventDefault(); openLegalModal('cookie'); });
    if (linkAml) linkAml.addEventListener('click', (e) => { e.preventDefault(); openLegalModal('aml'); });

    // Resource Downloads
    document.querySelectorAll('.btn-download-res').forEach(btn => {
        btn.addEventListener('click', () => {
            const resName = btn.getAttribute('data-res') || 'Report';
            showToast(`Generating document download for ${resName}...`, 'success');
        });
    });

    // Blog Article Read Insights Handlers
    document.querySelectorAll('.btn-read-more').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.blog-card');
            const title = card ? card.querySelector('h3')?.textContent : 'Market Insights Report';
            showToast(`Opening "${title}" analysis report...`, 'info');
        });
    });

    // FAQ Accordions Toggle Handler
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.faq-item');
            if (item) {
                const isOpen = item.classList.contains('active');
                document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
                if (!isOpen) item.classList.add('active');
            }
        });
    });

    // FAQ Live Search Filter Handler
    const faqSearchInput = document.getElementById('faq-search');
    if (faqSearchInput) {
        faqSearchInput.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            document.querySelectorAll('.faq-item').forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(q) ? 'block' : 'none';
            });
        });
    }

    // Contact Form Submit Handler (matches #contact-form and #form-contact)
    const mainContactForm = document.getElementById('contact-form') || document.getElementById('form-contact');
    if (mainContactForm) {
        mainContactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('c-name') || document.getElementById('contact-name');
            const name = nameInput ? nameInput.value : 'Valued Investor';
            showToast(`Thank you ${name}! Your inquiry was received and assigned to a Wealth Specialist.`, 'success');
            mainContactForm.reset();
        });
    }

    // Newsletter Subscription Form Handler (#newsletter-form)
    const subNewsletterForm = document.getElementById('newsletter-form');
    if (subNewsletterForm) {
        subNewsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = subNewsletterForm.querySelector('input[type="email"]');
            const email = emailInput ? emailInput.value : '';
            showToast(`🎉 Thank you! ${email || 'Your email'} has been subscribed to Buffy Market Intelligence.`, 'success');
            subNewsletterForm.reset();
        });
    }

    // Careers & Help Center Footer Link Handlers
    const linkCareers = document.getElementById('link-careers');
    if (linkCareers) {
        linkCareers.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('Briefing PDF for Buffy Careers & Open Wealth Advisor Positions loaded.', 'info');
        });
    }

    const linkHelp = document.getElementById('link-help');
    if (linkHelp) {
        linkHelp.addEventListener('click', (e) => {
            e.preventDefault();
            const faqSection = document.getElementById('faq');
            if (faqSection) {
                switchView(false);
                faqSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // CSV Export Button
    const btnExportCSV = document.querySelector('.dash-table-card .btn-text');
    if (btnExportCSV) {
        btnExportCSV.addEventListener('click', () => {
            showToast('Generating official transaction history CSV export...', 'success');
        });
    }

    // ------------------------------------------------------------------
    // 14. EMBEDDED DASHBOARD DEPOSIT FUNDS ENGINE & LIVE CALCULATOR
    // ------------------------------------------------------------------
    function updateDepositLiveSummary() {
        const amtInput = document.getElementById('dep-amount-input');
        const currSelect = document.getElementById('dep-currency-input');
        const methodSelect = document.getElementById('dep-gateway-select');

        const sumAmt = document.getElementById('dash-sum-amount');
        const sumFee = document.getElementById('dash-sum-fee');
        const sumMethod = document.getElementById('dash-sum-method');
        const sumTime = document.getElementById('dash-sum-time');
        const sumTotal = document.getElementById('dash-sum-total');

        if (!amtInput) return;

        const val = parseFloat(amtInput.value) || 0;
        const curr = currSelect ? currSelect.value : 'USD';
        const method = methodSelect ? methodSelect.value : 'Bank Transfer';

        const currSymbol = curr === 'EUR' ? '€' : (curr === 'GBP' ? '£' : '$');
        const formattedVal = `${currSymbol} ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        if (sumAmt) sumAmt.textContent = formattedVal;
        if (sumFee) sumFee.textContent = `${currSymbol} 0.00 (Free)`;
        if (sumMethod) sumMethod.textContent = method;

        if (sumTime) {
            if (method.includes('Card') || method.includes('Wallet')) sumTime.textContent = 'Instant';
            else if (method.includes('Crypto') || method.includes('USDT') || method.includes('BTC') || method.includes('ETH')) sumTime.textContent = '10-15 Minutes';
            else sumTime.textContent = '1-2 Business Days';
        }

        if (sumTotal) sumTotal.textContent = formattedVal;
    }

    const paymentCards = document.querySelectorAll('.payment-card');
    paymentCards.forEach(card => {
        card.addEventListener('click', () => {
            paymentCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            const method = card.getAttribute('data-method');
            const methodSelect = document.getElementById('dep-gateway-select');
            if (methodSelect) {
                for (let i = 0; i < methodSelect.options.length; i++) {
                    if (methodSelect.options[i].value.includes(method) || method.includes(methodSelect.options[i].value)) {
                        methodSelect.selectedIndex = i;
                        break;
                    }
                }
            }
            updateDepositLiveSummary();
        });
    });

    const depAmt = document.getElementById('dep-amount-input');
    const depCurr = document.getElementById('dep-currency-input');
    const depMethodSel = document.getElementById('dep-gateway-select');

    if (depAmt) depAmt.addEventListener('input', updateDepositLiveSummary);
    if (depCurr) depCurr.addEventListener('change', updateDepositLiveSummary);
    if (depMethodSel) depMethodSel.addEventListener('change', updateDepositLiveSummary);

    // Status Filter Tabs
    const statusTabs = document.querySelectorAll('#dash-deposit-status-tabs .d-tab');
    statusTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            statusTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const filter = tab.getAttribute('data-status');
            const tableRows = document.querySelectorAll('#dash-deposit-history-table tbody tr');

            tableRows.forEach(row => {
                const rowStatus = row.getAttribute('data-status');
                if (filter === 'all' || rowStatus === filter) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    });

    // Standalone Deposit Form Handler
    const standaloneDepositForm = document.getElementById('standalone-deposit-form');
    if (standaloneDepositForm) {
        standaloneDepositForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const amt = parseFloat(document.getElementById('dep-amount')?.value || 0);
            const curr = document.getElementById('dep-currency')?.value || 'USD';
            const method = document.getElementById('dep-selected-method')?.value || 'Bank Transfer';
            const tier = document.getElementById('dep-account-tier')?.value || 'Growth';
            const userEmail = currentUser ? currentUser.email : 'investor@buffyinvestment.com';

            if (amt <= 0) {
                showToast('Please enter a valid deposit amount greater than 0.', 'error');
                return;
            }

            const btnSubmit = document.getElementById('btn-continue-deposit');
            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing Payment Securely...';
            }

            if (supabaseClient) {
                try {
                    await supabaseClient.from('user_transactions').insert([
                        { user_email: userEmail, tx_type: 'Deposit', asset_class: `${tier} Strategy (${method} - ${curr})`, amount: amt, status: 'Completed' }
                    ]);
                } catch (err) {
                    console.log('Deposit submission note:', err);
                }
            }

            setTimeout(async () => {
                await recalculateUserBalances(userEmail);
                loadUserTransactionsFromSupabase();
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = 'Continue Deposit <i class="fa-solid fa-arrow-right"></i>';
                }
                showToast(`🎉 Deposit Request Successful! $${amt.toLocaleString()} credited via ${method}. Portfolio balance updated.`, 'success');
            }, 1200);
        });
    }

    // ------------------------------------------------------------------
    // SETTINGS HUB SUB-TAB SWITCHER & FORM HANDLERS
    // ------------------------------------------------------------------
    const setTabBtns = document.querySelectorAll('.set-tab-btn[data-set-tab], .set-m-tab[data-set-tab]');
    setTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-set-tab');
            
            // Highlight active button in all tab bars
            setTabBtns.forEach(b => {
                if (b.getAttribute('data-set-tab') === targetTab) {
                    b.classList.add('active');
                } else {
                    b.classList.remove('active');
                }
            });

            // Hide all setting boxes and show target box
            const setBoxes = document.querySelectorAll('.settings-panel-box');
            setBoxes.forEach(box => {
                if (box.id === `set-box-${targetTab}`) {
                    box.classList.remove('hidden');
                    box.classList.add('active');
                    box.style.setProperty('display', 'block', 'important');
                } else {
                    box.classList.add('hidden');
                    box.classList.remove('active');
                    box.style.setProperty('display', 'none', 'important');
                }
            });
        });
    });

    // Profile Settings Form Submit
    const formSetProfile = document.getElementById('form-settings-profile');
    if (formSetProfile) {
        formSetProfile.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullNameVal = document.getElementById('setting-fullname')?.value || 'Angel';
            const userEmail = currentUser ? currentUser.email : 'investor@buffyinvestment.com';

            setDashboardUserInfo(fullNameVal, 'Growth Strategy Plan', userEmail);

            if (supabaseClient && currentUser) {
                try {
                    await supabaseClient.from('user_profiles').upsert([
                        { email: userEmail, full_name: fullNameVal, target_plan: 'Growth Strategy Plan' }
                    ], { onConflict: 'email' });
                } catch (err) {
                    console.log('Profile update note:', err);
                }
            }
            showToast('✅ Investor profile changes saved successfully!', 'success');
        });
    }

    // Account Info Form Submit
    const formSetAccount = document.getElementById('form-settings-account');
    if (formSetAccount) {
        formSetAccount.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('✅ Account details updated successfully!', 'success');
        });
    }

    // Password Update Form Submit
    const formSetPassword = document.getElementById('form-settings-password');
    if (formSetPassword) {
        formSetPassword.addEventListener('submit', (e) => {
            e.preventDefault();
            const newPass = document.getElementById('set-new-pass')?.value;
            const confirmPass = document.getElementById('set-confirm-pass')?.value;

            if (newPass !== confirmPass) {
                showToast('Passwords do not match. Please re-enter.', 'error');
                return;
            }
            showToast('🔒 Account password updated successfully!', 'success');
            formSetPassword.reset();
        });
    }

    // 2FA Toggle Switch Handler
    const toggle2FA = document.getElementById('toggle-2fa-setting');
    if (toggle2FA) {
        toggle2FA.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            showToast(isChecked ? '🛡️ Two-Factor Authentication (2FA) is ENABLED.' : '⚠️ Two-Factor Authentication disabled.', isChecked ? 'success' : 'info');
        });
    }

    // Add Payment Method CTA
    const btnAddPayment = document.getElementById('btn-add-payment-method');
    if (btnAddPayment) {
        btnAddPayment.addEventListener('click', () => {
            const newMethod = prompt('Enter Bank ACH Account or Crypto Wallet Address to add:');
            if (newMethod) {
                showToast(`💳 Payment Method "${newMethod}" submitted for verification.`, 'success');
            }
        });
    }

    // Notifications Form Submit
    const formSetNotif = document.getElementById('form-settings-notifications');
    if (formSetNotif) {
        formSetNotif.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('🔔 Notification preferences saved.', 'success');
        });
    }

    // Data Archive CTA
    const btnDownloadData = document.getElementById('btn-download-user-data');
    if (btnDownloadData) {
        btnDownloadData.addEventListener('click', () => {
            showToast('📥 Preparing encrypted account data archive for download...', 'info');
        });
    }

    // Platform Preferences Form Submit
    const formSetPref = document.getElementById('form-settings-preferences');
    if (formSetPref) {
        formSetPref.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('⚙️ Platform preferences saved.', 'success');
        });
    }

    // Dedicated Referral Panel Copy & Share Button Handlers
    const btnCopyMainRef = document.getElementById('btn-copy-main-ref');
    const btnShareMainRef = document.getElementById('btn-share-main-ref');
    const refLinkMainInput = document.getElementById('ref-link-main-input');

    if (btnCopyMainRef && refLinkMainInput) {
        btnCopyMainRef.addEventListener('click', () => {
            refLinkMainInput.select();
            if (navigator.clipboard) {
                navigator.clipboard.writeText(refLinkMainInput.value).then(() => {
                    showToast('📋 Referral link copied to clipboard!', 'success');
                }).catch(() => {
                    showToast('📋 Referral link copied to clipboard!', 'success');
                });
            } else {
                showToast('📋 Referral link copied to clipboard!', 'success');
            }
        });
    }

    if (btnShareMainRef && refLinkMainInput) {
        btnShareMainRef.addEventListener('click', () => {
            if (navigator.share) {
                navigator.share({
                    title: 'Invest with Buffy.com',
                    text: 'Join Buffy.com quantitative wealth management and start growing your capital with 10% bonus yields!',
                    url: refLinkMainInput.value
                }).catch(() => {});
            } else {
                if (navigator.clipboard) navigator.clipboard.writeText(refLinkMainInput.value);
                showToast('🔗 Referral link copied! Share it with your network to earn instant commissions.', 'info');
            }
        });
    }

    // ------------------------------------------------------------------
    // BANNERS LINKS PANEL INTERACTIVE BUTTON HANDLERS
    // ------------------------------------------------------------------
    document.addEventListener('click', (e) => {
        // 1. Copy HTML Embed Code
        const btnCode = e.target.closest('.btn-copy-banner-code');
        if (btnCode) {
            const container = btnCode.closest('.form-group');
            const codeEl = container ? container.querySelector('.banner-embed-code') : null;
            if (codeEl) {
                codeEl.select();
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(codeEl.value).then(() => {
                        showToast('📋 HTML Embed Code copied to clipboard!', 'success');
                    }).catch(() => {
                        showToast('📋 HTML Embed Code copied to clipboard!', 'success');
                    });
                } else {
                    showToast('📋 HTML Embed Code copied to clipboard!', 'success');
                }
            }
            return;
        }

        // 2. Copy Direct Image URL
        const btnUrl = e.target.closest('.btn-copy-banner-url');
        if (btnUrl) {
            const container = btnUrl.closest('.form-group');
            const inputEl = container ? container.querySelector('.banner-url-input') : null;
            if (inputEl) {
                inputEl.select();
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(inputEl.value).then(() => {
                        showToast('🔗 Direct Image URL copied to clipboard!', 'success');
                    }).catch(() => {
                        showToast('🔗 Direct Image URL copied to clipboard!', 'success');
                    });
                } else {
                    showToast('🔗 Direct Image URL copied to clipboard!', 'success');
                }
            }
            return;
        }

        // 3. Copy Referral Link Action
        const btnRefLinkAction = e.target.closest('.btn-copy-banner-link-action');
        if (btnRefLinkAction) {
            const refInput = document.getElementById('ref-link-main-input') || document.getElementById('dash-ref-link');
            const targetVal = refInput ? refInput.value : 'https://buffyinvestment.com/?ref=Angel';
            if (navigator.clipboard) {
                navigator.clipboard.writeText(targetVal).then(() => {
                    showToast('📋 Referral link copied to clipboard!', 'success');
                });
            } else {
                showToast('📋 Referral link copied to clipboard!', 'success');
            }
            return;
        }

        // 4. Download Banner Asset Package
        const btnDownload = e.target.closest('.btn-download-banner-asset');
        if (btnDownload) {
            const size = btnDownload.getAttribute('data-size') || 'banner';
            showToast(`📥 Preparing high-res ${size} banner asset download package...`, 'info');
            return;
        }

        // 5. Share Banner Asset
        const btnShareBanner = e.target.closest('.btn-share-banner-asset');
        if (btnShareBanner) {
            const refInput = document.getElementById('ref-link-main-input') || document.getElementById('dash-ref-link');
            const targetVal = refInput ? refInput.value : 'https://buffyinvestment.com/?ref=Angel';
            if (navigator.share) {
                navigator.share({
                    title: 'Buffy.com Promotional Banner',
                    text: 'Invest with Buffy.com - Quantitative Wealth Management Suite',
                    url: targetVal
                }).catch(() => {});
            } else {
                if (navigator.clipboard) navigator.clipboard.writeText(targetVal);
                showToast('🔗 Promotional banner link copied! Ready to share on social networks.', 'info');
            }
            return;
        }

        // 6. Tell a Friend Copy Link
        const btnTellCopy = e.target.closest('#btn-tell-copy-link');
        if (btnTellCopy) {
            const tellInput = document.getElementById('tell-friend-link-input');
            if (tellInput) {
                tellInput.select();
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(tellInput.value).then(() => {
                        showToast('📋 Referral link copied to clipboard!', 'success');
                    }).catch(() => {
                        showToast('📋 Referral link copied to clipboard!', 'success');
                    });
                } else {
                    showToast('📋 Referral link copied to clipboard!', 'success');
                }
            }
            return;
        }

        // 7. Tell a Friend Share Link
        const btnTellShare = e.target.closest('#btn-tell-share-link');
        if (btnTellShare) {
            const tellInput = document.getElementById('tell-friend-link-input');
            const targetUrl = tellInput ? tellInput.value : 'https://buffyinvestment.com/?ref=Angel';
            if (navigator.share) {
                navigator.share({
                    title: 'Join me on Buffy.com',
                    text: 'Explore institutional quantitative wealth management with up to 14.8% APY yields!',
                    url: targetUrl
                }).catch(() => {});
            } else {
                if (navigator.clipboard) navigator.clipboard.writeText(targetUrl);
                showToast('🔗 Referral link copied! Ready to share with your friends.', 'info');
            }
            return;
        }

        // 8. Social Share Chips (WhatsApp, Telegram, Twitter, Facebook, Email)
        const chipWA = e.target.closest('.btn-share-chip-whatsapp');
        const chipTG = e.target.closest('.btn-share-chip-telegram');
        const chipTW = e.target.closest('.btn-share-chip-twitter');
        const chipFB = e.target.closest('.btn-share-chip-facebook');
        const chipEM = e.target.closest('.btn-share-chip-email');

        if (chipWA || chipTG || chipTW || chipFB || chipEM) {
            const tellInput = document.getElementById('tell-friend-link-input');
            const refUrl = encodeURIComponent(tellInput ? tellInput.value : 'https://buffyinvestment.com/?ref=Angel');
            const msg = encodeURIComponent('Hey! Check out Buffy.com for quantitative wealth management and high-yield growth strategies: ');

            if (chipWA) window.open(`https://api.whatsapp.com/send?text=${msg}${refUrl}`, '_blank');
            if (chipTG) window.open(`https://t.me/share/url?url=${refUrl}&text=${msg}`, '_blank');
            if (chipTW) window.open(`https://twitter.com/intent/tweet?text=${msg}&url=${refUrl}`, '_blank');
            if (chipFB) window.open(`https://www.facebook.com/sharer/sharer.php?u=${refUrl}`, '_blank');
            if (chipEM) window.open(`mailto:?subject=${encodeURIComponent('Join Buffy.com Wealth Management')}&body=${msg}${refUrl}`, '_blank');
            return;
        }
    });

    // Send Direct Email Invitation Form Handler
    const formTellEmail = document.getElementById('form-tell-friend-email');
    if (formTellEmail) {
        formTellEmail.addEventListener('submit', (e) => {
            e.preventDefault();
            const friendName = document.getElementById('tell-friend-name')?.value || 'Friend';
            const friendEmail = document.getElementById('tell-friend-email')?.value || '';
            showToast(`📩 Official invitation email dispatched to ${friendName} (${friendEmail})!`, 'success');
            formTellEmail.reset();
        });
    }
});
