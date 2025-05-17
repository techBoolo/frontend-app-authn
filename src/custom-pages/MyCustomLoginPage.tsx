// src/custom-pages/MyCustomLoginPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux'; // For Redux
import { FaUser, FaLock, FaFingerprint, FaCheckCircle, FaUserTie, FaChild } from 'react-icons/fa';

// Import actions and selectors from the MFE's Redux structure
// Adjust paths based on where you place this file relative to 'src'
import { loginRequest } from '../login/data/actions'; // Key login action
import { DEFAULT_STATE, PENDING_STATE } from '../data/constants'; // For submitState
// You'll need to create/find selectors for these or access them directly from state.register
// For simplicity, I'll assume direct access from a 'login' slice of the state.
// Example: const loginState = useSelector(state => state.login);

// Import utilities
import { getAllPossibleQueryParams, updatePathWithQueryParams } from '../data/utils'; // For query params
import LoginFailureMessage from '../login/LoginFailure'; // To display login errors (optional, or create your own)

interface AccountProfile {
    id: string;
    name: string;
    avatarUrl: string;
    cardColor: string;
    usernameHint?: string;
    roleType: 'parent' | 'child';
}

type LoginRoleType = 'parent' | 'child' | null;

// Your MOCK DATA - In a real app, this would come from a more persistent source
const allAccounts: AccountProfile[] = [
    { id: 'abel', name: 'Abel Kebede', avatarUrl: '/nick-name-page-avatar-boy-blue-eyes.png', cardColor: '#00A99D', usernameHint: 'abelk', roleType: 'child' },
    { id: 'kebede', name: 'Kebede', avatarUrl: '/nick-name-page-avatar-boy-brown-hair.jpg', cardColor: '#B0BEC5', usernameHint: 'kebede_p', roleType: 'parent' },
    { id: 'tantos', name: 'Tantos Kebede', avatarUrl: '/nick-name-page-avatar-boy-laugh.png', cardColor: '#FF7F50', usernameHint: 'tantosk', roleType: 'child' },
    { id: 'babi', name: 'Babi kebede', avatarUrl: '/nick-name-page-avatar-boy-red-shirt.png', cardColor: '#D4AC0D', usernameHint: 'babik', roleType: 'child' },
];

const MyCustomLoginPage: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch(); // Get dispatch function

    const [selectedLoginRole, setSelectedLoginRole] = useState<LoginRoleType>(null);
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Select relevant data from Redux store (mirroring LoginPage.jsx's mapStateToProps)
    const loginState = useSelector((state: any) => state.login); // Assuming 'login' is the slice name
    const {
        loginErrorCode,
        loginErrorContext,
        loginResult, // { success: boolean, redirectUrl?: string }
        submitState = DEFAULT_STATE, // 'default', 'pending', 'complete', 'failure'
    } = loginState || {}; // Provide default empty object if loginState is undefined initially

    const queryParams = useMemo(() => getAllPossibleQueryParams(), []);

    const filteredAccounts = useMemo(() => {
        if (selectedLoginRole === 'parent') {
            return allAccounts.filter(acc => acc.roleType === 'parent');
        }
        if (selectedLoginRole === 'child') {
            return allAccounts.filter(acc => acc.roleType === 'child');
        }
        return [];
    }, [selectedLoginRole]);

    const handleLoginRoleSelect = (role: LoginRoleType) => { /* ... your existing logic ... */
        setSelectedLoginRole(role);
        if (selectedAccountId) {
            const currentSelectedAccount = allAccounts.find(acc => acc.id === selectedAccountId);
            if (currentSelectedAccount && currentSelectedAccount.roleType !== role) {
                setSelectedAccountId(null); setUsername(''); setPassword('');
            }
        } else {
            setUsername(''); setPassword('');
        }
    };
    const handleAccountSelect = (account: AccountProfile) => { /* ... your existing logic ... */
        setSelectedAccountId(account.id);
        setUsername(account.usernameHint || '');
        setPassword('');
    };

    // --- Handle redirection after successful login ---
    // src/custom-pages/MyCustomLoginPage.tsx
    // ... other imports ...
    // Make sure this import is correct and you're getting the one from this MFE

    // ...

    // Inside your MyCustomLoginPage component:
    useEffect(() => {
        if (loginResult?.success) {
            let targetDashboard = '/dashboard';
            if (selectedLoginRole === 'parent' && selectedAccountId === 'kebede') {
                targetDashboard = '/parent-dashboard';
            }

            // Determine the base path for redirection
            const basePathForRedirect = loginResult.redirectUrl || targetDashboard;

            // Call updatePathWithQueryParams with ONLY the basePathForRedirect
            // It will internally use window.location.search to append current query params.
            const finalRedirectUrl = updatePathWithQueryParams(basePathForRedirect);

            console.log(`Login successful, redirecting to: ${finalRedirectUrl}`);
            // It's generally better to let Open edX handle full page reloads if necessary,
            // especially if the redirectUrl comes from the backend and might point to a different domain or MFE.
            // If finalRedirectUrl is an internal path to your MFE, navigate() is fine.
            // If it could be an external path or needs a full refresh, window.location.href is safer.
            if (loginResult.redirectUrl) { // If backend provided a specific redirect
                window.location.href = finalRedirectUrl;
            } else { // For your internal dashboard navigations
                navigate(finalRedirectUrl, { replace: true });
            }
        }
    }, [loginResult, selectedLoginRole, selectedAccountId, navigate]); // Removed queryParams from dependency array as it's handled internally by the util

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLoginRole) { alert('Please select your role (Parent or Child).'); return; }
        if (!selectedAccountId) { alert('Please select an account profile.'); return; }
        if (!username || !password) { alert('Please enter username and password.'); return; }
        const queryParams = getAllPossibleQueryParams();
        const payload = {
            email_or_username: username,
            password: password,
            ...queryParams, // Include query params as LoginPage.jsx does
        };
        dispatch(loginRequest(payload)); // <<< DISPATCH THE MFE's ACTION
    };

    const handleAddNewAccount = () => navigate('/create-account');
    const handleFingerprint = () => { /* ... your existing logic, possibly dispatching another action ... */ };

    // --- Your STYLES object ... ---
    const styles: { [key: string]: React.CSSProperties } = {
        // ... (pageContainer, headerSection, appLogo, title, subtitle - no changes)
        pageContainer: { /* ... existing ... */ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', padding: '30px 20px', backgroundColor: '#f4f6f8', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', },
        headerSection: { /* ... existing ... */ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px', textAlign: 'center', }, // Reduced marginBottom
        appLogo: { /* ... existing ... */ width: '80px', height: 'auto', marginBottom: '15px' },
        title: { /* ... existing ... */ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '5px' },
        subtitle: { /* ... existing ... */ fontSize: '14px', color: '#777', maxWidth: '300px', lineHeight: 1.5, marginBottom: '20px' }, // Added marginBottom

        // --- NEW STYLES for Login Role Selection ---
        loginRoleSelectionContainer: {
            display: 'flex',
            justifyContent: 'center', // Center the buttons
            width: '100%',
            maxWidth: '350px', // Match other content width
            marginBottom: '20px',
            gap: '15px',
        },
        loginRoleButton: {
            flexGrow: 1, // Buttons take equal width
            padding: '12px',
            border: '2px solid #ccc',
            borderRadius: '12px',
            backgroundColor: '#fff',
            cursor: 'pointer',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '15px',
            fontWeight: '500',
            color: '#555',
            transition: 'border-color 0.2s, background-color 0.2s, color 0.2s',
        },
        loginRoleButtonSelected: {
            borderColor: '#007bff',
            backgroundColor: '#e7f3ff',
            color: '#0056b3',
        },
        loginRoleIcon: {
            fontSize: '20px',
        },
        // --- END NEW STYLES ---

        accountGrid: { /* ... existing ... */ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', width: '100%', maxWidth: '350px', marginBottom: '30px', minHeight: '120px' /* Add minHeight to prevent collapse */, },
        accountCard: { /* ... existing ... */ borderRadius: '16px', padding: '15px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '120px', textAlign: 'center', color: '#fff', position: 'relative', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', transition: 'transform 0.2s, box-shadow 0.2s', },
        selectedCardOverlay: { /* ... existing ... */ position: 'absolute', top: '8px', right: '8px', fontSize: '24px', color: '#007bff', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: '50%', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', },
        accountAvatar: { /* ... existing ... */ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', marginBottom: '8px', border: '2px solid rgba(255,255,255,0.5)', },
        accountName: { /* ... existing ... */ fontSize: '13px', fontWeight: '500' },
        formSection: { /* ... existing ... */ width: '100%', maxWidth: '350px', display: 'flex', flexDirection: 'column', gap: '15px', },
        inputGroup: { /* ... existing ... */ display: 'flex', alignItems: 'center', gap: '10px' },
        inputFieldContainer: { /* ... existing ... */ flexGrow: 1, position: 'relative', display: 'flex', alignItems: 'center', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #ddd', padding: '0 15px', },
        inputIcon: { /* ... existing ... */ color: '#888', marginRight: '10px' },
        input: { /* ... existing ... */ flexGrow: 1, border: 'none', outline: 'none', padding: '15px 0', fontSize: '16px', backgroundColor: 'transparent', },
        fingerprintButton: { /* ... existing ... */ padding: '15px', border: '1px solid #ddd', borderRadius: '12px', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', },
        loginButton: { /* ... existing ... */ width: '100%', padding: '15px', fontSize: '17px', color: '#fff', backgroundColor: '#007bff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px', },
        addNewAccountLink: { /* ... existing ... */ textAlign: 'center', color: '#007bff', fontSize: '14px', textDecoration: 'none', marginTop: '15px', display: 'block', },
    };
    return (
        <div style={styles.pageContainer}>
            {/* ... Header Section ... */}
            <section style={styles.headerSection}>
                <img src="/create-account-logo.png" alt="App Logo" style={styles.appLogo} onError={(e) => e.currentTarget.style.display = 'none'} />
                <h1 style={styles.title}>Select your account</h1>
                <p style={styles.subtitle}>Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed</p>
            </section>

            {/* ... Login Role Selection ... */}
            <section style={styles.loginRoleSelectionContainer}>
                <button type="button" style={{ ...styles.loginRoleButton, ...(selectedLoginRole === 'parent' ? styles.loginRoleButtonSelected : {}) }} onClick={() => handleLoginRoleSelect('parent')}> <FaUserTie style={styles.loginRoleIcon} /> Parent </button>
                <button type="button" style={{ ...styles.loginRoleButton, ...(selectedLoginRole === 'child' ? styles.loginRoleButtonSelected : {}) }} onClick={() => handleLoginRoleSelect('child')}> <FaChild style={styles.loginRoleIcon} /> Child </button>
            </section>

            {/* Display Login Errors (using the MFE's component or your own) */}
            {loginErrorCode && (
                <LoginFailureMessage
                    errorCode={loginErrorCode}
                    errorCount={1} // You might need to manage error count if relevant
                    context={loginErrorContext || {}}
                />
            )}

            {/* Account Grid */}
            {selectedLoginRole && (
                <section style={styles.accountGrid}>
                    {/* ... your filteredAccounts.map logic ... */}
                    {filteredAccounts.length > 0 ? filteredAccounts.map((acc) => (
                        <div key={acc.id} style={{ ...styles.accountCard, backgroundColor: acc.cardColor }} onClick={() => handleAccountSelect(acc)}>
                            {selectedAccountId === acc.id && (<div style={styles.selectedCardOverlay}><FaCheckCircle /></div>)}
                            <img src={acc.avatarUrl} alt={acc.name} style={styles.accountAvatar} onError={(e) => e.currentTarget.style.display = 'none'} />
                            <span style={styles.accountName}>{acc.name}</span>
                        </div>
                    )) : (<p>No {selectedLoginRole} accounts found.</p>)}
                </section>
            )}

            {/* Login Form */}
            {(selectedLoginRole && selectedAccountId) && (
                <form style={styles.formSection} onSubmit={handleLogin}>
                    {/* ... Username, Password inputs ... */}
                    <div style={styles.inputFieldContainer}><FaUser style={styles.inputIcon} /><input type="text" placeholder="Username" style={styles.input} value={username} onChange={(e) => setUsername(e.target.value)} required /></div>
                    <div style={styles.inputGroup}><div style={styles.inputFieldContainer}><FaLock style={styles.inputIcon} /><input type="password" placeholder="Password" style={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} required /></div><button type="button" style={styles.fingerprintButton} onClick={handleFingerprint}><FaFingerprint size={22} color="#555" /></button></div>

                    {/* Use a StatefulButton or a simple button and manage loading state yourself */}
                    <button type="submit" style={styles.loginButton} disabled={submitState === PENDING_STATE}>
                        {submitState === PENDING_STATE ? 'Logging in...' : 'login'}
                    </button>
                </form>
            )}
            {/* ... Add New Account Link ... */}
            <a href="#add-new" style={styles.addNewAccountLink} onClick={(e) => { e.preventDefault(); handleAddNewAccount(); }}>Add new account</a>
        </div>
    );
};

export default MyCustomLoginPage;