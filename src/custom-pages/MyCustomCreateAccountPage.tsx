// src/custom-pages/MyCustomCreateAccountPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaChild, FaUserTie,
    FaAddressCard // For Name field
} from 'react-icons/fa';

// --- MFE Imports ---
// Actions
import { registerNewUser, setEmailSuggestionInStore, clearRegistrationBackendError } from '../register/data/actions'; // Adjust path
// Selectors (or direct state access) - you might need more selectors as you refine
import getBackendValidations from '../register/data/selectors'; // For backend validation errors
// Utilities
import { isFormValid, prepareRegistrationPayload } from '../register/data/utils'; // Adjust path
import { getAllPossibleQueryParams, updatePathWithQueryParams } from '../data/utils'; // General utils
// Constants
import { DEFAULT_STATE, PENDING_STATE, FORM_SUBMISSION_ERROR } from '../data/constants'; // Or from '../data/constants'
// Components (optional, if you want to reuse MFE's error display)
import RegistrationFailure from '../register/components/RegistrationFailure';

// --- Your Types ---
// type AccountType = 'parent' | 'child' | null;

const MyCustomCreateAccountPage: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // --- Your Component State ---
    const [name, setName] = useState(''); // <<< NEW: Name field state
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    // const [selectedAccountType, setSelectedAccountType] = useState<AccountType>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({}); // For client-side validation errors

    // --- Redux State ---
    const registrationState = useSelector((state: any) => state.register); // Assuming 'register' is the slice name
    const {
        registrationError, // { errorCode, field_errors (for backend field-specific errors) }
        registrationResult, // { success: boolean, redirectUrl?: string, authenticatedUser?: object }
        submitState = DEFAULT_STATE,
        // emailSuggestion, // If you want to use email suggestions
    } = registrationState || {};

    const commonComponentsState = useSelector((state: any) => state.commonComponents);
    const {
        // fieldDescriptions, // For configurable fields, skipping for now
    } = commonComponentsState || {};

    const queryParams = useMemo(() => getAllPossibleQueryParams(), []);
    const backendValidations = useSelector(getBackendValidations); // Gets field_errors from registrationError

    // --- Handle Redirection and Error Display from Redux ---
    useEffect(() => {
        if (registrationResult?.success) {
            alert('Account created successfully!'); // Or a more subtle notification

            let basePathForRedirect = '';
            // if (selectedAccountType === 'parent') {
            //     basePathForRedirect = '/parent-dashboard';
            // } else if (selectedAccountType === 'child') {
            //     basePathForRedirect = '/select-role';
            // }

            if (basePathForRedirect) {
                // Call updatePathWithQueryParams with ONLY the basePathForRedirect
                // It will internally use window.location.search.
                const finalRedirectUrl = updatePathWithQueryParams(basePathForRedirect);

                console.log(`Account creation successful, redirecting to: ${finalRedirectUrl}`);

                // Decide on navigation method:
                // If the MFE's registrationResult.redirectUrl is populated and should be prioritized,
                // use that. Otherwise, use your custom logic.
                if (registrationResult.redirectUrl) { // If backend/MFE logic provides a specific redirect
                    // It's possible this URL already has query params if it came from the backend
                    // but updatePathWithQueryParams should handle merging/appending current ones correctly.
                    const backendRedirectWithCurrentParams = updatePathWithQueryParams(registrationResult.redirectUrl);
                    window.location.href = backendRedirectWithCurrentParams;
                } else { // For your internal dashboard/flow navigations
                    navigate(finalRedirectUrl, { replace: true });
                }
            }
        }
        // The dependency array should reflect what this effect actually depends on to re-run.
        // `queryParams` from useMemo is stable unless its own dependencies change (none here).
        // The main trigger is `registrationResult`.
    }, [registrationResult, navigate]); // Removed queryParams from deps as it's not directly used to re-evaluate THIS effect's logic, though it's used to construct the URL

    useEffect(() => {
        // If backend returns field-specific errors, merge them into formErrors
        if (backendValidations && Object.keys(backendValidations).length > 0) {
            setFormErrors(prev => ({ ...prev, ...backendValidations }));
        }
    }, [backendValidations]);


    const handleCreateAccount = (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors({}); // Clear previous client-side errors

        // if (!selectedAccountType) { alert('Please select an account type.'); return; }
        if (!agreedToTerms) { alert('Please agree to the terms and conditions.'); return; }

        // --- Construct formFields for validation and payload ---
        // The MFE's utils expect a certain structure.
        // Your form now needs to collect 'name'.
        const currentFormFields = {
            name, // From your component's state
            username,
            email,
            password,
            terms_of_service: agreedToTerms, // Map your field to what Open edX expects
            honor_code: agreedToTerms,       // Often the same as terms_of_service
            // marketing_email_opt_in: false, // If you add this checkbox
            // country: 'US', // Example, if you add configurable fields
            // level_of_education: 'p', // Example
            // gender: 'm', // Example
        };

        // Client-side validation using MFE's utility (or your own)
        // `isFormValid` from MFE is complex as it deals with configurable fields.
        // For a simpler start, basic client-side checks:
        let currentClientErrors: Record<string, string> = {};
        if (!name.trim()) currentClientErrors.name = 'Name is required.';
        if (!username.trim()) currentClientErrors.username = 'Username is required.';
        if (!email.trim()) currentClientErrors.email = 'Email is required.'; // Add email format validation
        if (!password) currentClientErrors.password = 'Password is required.'; // Add password strength validation
        // ... more checks ...

        if (Object.keys(currentClientErrors).length > 0) {
            setFormErrors(currentClientErrors);
            // Dispatch an action to show a generic form error or handle locally
            // dispatch({ type: FORM_SUBMISSION_ERROR }); // If you want to use MFE's error display
            alert("Please correct the errors in the form.");
            return;
        }

        // --- Prepare payload using MFE's utility ---
        // `prepareRegistrationPayload` also handles configurable fields, so we'll pass an empty
        // object for `configurableFormFields` for now.
        // It also requires `totalRegistrationTime` which we can approximate.
        const formStartTime = Date.now(); // Approximation
        const totalRegistrationTime = (Date.now() - formStartTime) / 1000;

        const payload = prepareRegistrationPayload(
            currentFormFields,
            {}, // Empty configurableFormFields for now
            false, // marketing_email_opt_in (if you don't have this checkbox)
            totalRegistrationTime,
            queryParams
        );

        // --- Add your custom accountType to the payload ---
        // The backend API needs to be modified to accept this.
        // const finalPayload = {
        //     ...payload,
        //     account_type: selectedAccountType, // Your custom field
        // };

        console.log('Dispatching registerNewUser with payload:', payload);
        dispatch(registerNewUser(payload));
    };

    const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, fieldName: string, value: string) => {
        setter(value);
        // Clear specific error when user types
        if (formErrors[fieldName]) {
            setFormErrors(prev => ({ ...prev, [fieldName]: '' }));
        }
        // Clear backend error for this field if it exists
        if (registrationError?.field_errors?.[fieldName]) {
            dispatch(clearRegistrationBackendError(fieldName));
        }
    };


    const styles: { [key: string]: React.CSSProperties } = {
        // ... (keep all previous styles: pageContainer, logoImage, title, subtitle, form, inputGroup, etc.)
        pageContainer: { /* ... existing ... */
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
            minHeight: '100vh', padding: '40px 20px', backgroundColor: '#f8f9fa',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            boxSizing: 'border-box',
        },
        logoImage: { /* ... existing ... */ width: '100px', height: 'auto', marginBottom: '10px' },
        title: { /* ... existing ... */ fontSize: '25px', fontWeight: '500', color: '#212529', marginBottom: '8px', font: 'Dm sans' },
        subtitle: { /* ... existing ... */ fontSize: '14px', color: 'rgba(118, 115, 114, 1)', marginBottom: '30px', textAlign: 'center' },
        form: { /* ... existing ... */ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '15px' },

        // --- NEW STYLES for Account Type Selection ---
        accountTypeSelectionContainer: {
            display: 'flex',
            justifyContent: 'space-around',
            width: '28%',
            marginBottom: '20px', // Space before form inputs
            gap: '10px',
        },
        accountTypeButton: {
            flex: 1, // Make buttons take equal space
            padding: '15px 10px',
            border: '2px solid #ccc',
            borderRadius: '12px',
            backgroundColor: '#fff',
            cursor: 'pointer',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#555',
            transition: 'border-color 0.2s, background-color 0.2s, color 0.2s',
        },
        accountTypeButtonSelected: {
            borderColor: '#007bff',
            backgroundColor: '#e7f3ff', // Light blue background
            color: '#0056b3', // Darker blue text
        },
        accountTypeIcon: {
            fontSize: '24px', // Size of FaChild, FaUserTie
        },
        // --- END NEW STYLES ---

        inputGroup: { /* ... existing ... */ position: 'relative', display: 'flex', alignItems: 'center' },
        inputField: { /* ... existing ... */
            flexGrow: 1, padding: '15px 15px 15px 45px', fontSize: '16px', border: '1px solid rgba(6, 3, 2, 1)',
            borderRadius: '12px', boxSizing: 'border-box', outline: 'none', color: 'rgba(6, 3, 2, 1)', fontWeight: '500',
        },
        inputIcon: { /* ... existing ... */ position: 'absolute', left: '15px', color: 'rgba(6, 3, 2, 1)', fontSize: '18px' },
        passwordToggleIcon: { /* ... existing ... */ position: 'absolute', right: '15px', color: 'rgba(6, 3, 2, 1)', fontSize: '18px', cursor: 'pointer' },
        fingerprintButton: { /* ... existing ... */
            padding: '15px', border: '1px solid rgba(6, 3, 2, 1)', borderRadius: '12px', backgroundColor: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '10px',
        },
        passwordContainer: { /* ... existing ... */ display: 'flex', alignItems: 'center', width: '100%' },
        termsContainer: { /* ... existing ... */ display: 'flex', alignItems: 'center', margin: '15px 0', fontSize: '13px', color: '#333' },
        checkbox: { /* ... existing ... */ marginRight: '10px', width: '18px', height: '18px', accentColor: '#007bff' },
        link: { /* ... existing ... */ color: '#007bff', textDecoration: 'none', fontWeight: '500' },
        createAccountButton: { /* ... existing ... */
            width: '100%', padding: '15px', fontSize: '16px', color: '#ffffff', backgroundColor: '#007bff',
            border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '500', transition: 'background-color 0.2s', marginTop: '10px',
        },
        signInText: { /* ... existing ... */ marginTop: '25px', fontSize: '14px', color: '#333' },
    };


    return (
        <div style={styles.pageContainer}>
            {/* ... Logo, Title, Subtitle ... */}
            <img src="/create-account-logo.png" alt="App Logo" style={styles.logoImage} onError={(e) => (e.currentTarget.style.display = 'none')} />
            <h2 style={styles.title}>Create an Account</h2>
            <p style={styles.subtitle}>A handful of model sentence structures</p>


            {/* Display general registration errors */}
            {registrationError?.errorCode && registrationError.errorCode !== FORM_SUBMISSION_ERROR && !registrationError?.field_errors && (
                <RegistrationFailure
                    errorCode={registrationError.errorCode}
                    failureCount={1} // You might need a counter like in LoginPage.jsx
                    context={{}} // Add context if needed
                />
            )}

            {/* Account Type Selection */}
            {/* <div style={styles.accountTypeSelectionContainer}>
                <button type="button" style={{ ...styles.accountTypeButton, ...(selectedAccountType === 'parent' ? styles.accountTypeButtonSelected : {}) }} onClick={() => setSelectedAccountType('parent')}> <FaUserTie style={styles.accountTypeIcon} /> <span>I'm a Parent</span> </button>
                <button type="button" style={{ ...styles.accountTypeButton, ...(selectedAccountType === 'child' ? styles.accountTypeButtonSelected : {}) }} onClick={() => setSelectedAccountType('child')}> <FaChild style={styles.accountTypeIcon} /> <span>I'm a Child</span> </button>
            </div> */}

            <form style={styles.form} onSubmit={handleCreateAccount}>
                {/* Name Field (New) */}
                <div style={styles.inputGroup}>
                    <FaAddressCard style={styles.inputIcon} /> {/* Example icon for name */}
                    <input
                        type="text"
                        placeholder="Full Name"
                        style={styles.inputField}
                        value={name}
                        onChange={(e) => handleInputChange(setName, 'name', e.target.value)}
                        required
                    />
                </div>
                {formErrors.name && <p style={{ color: 'red', fontSize: '12px' }}>{formErrors.name}</p>}


                {/* Username, Email, Password Fields - include error display similar to name */}
                <div style={styles.inputGroup}>
                    <FaUser style={styles.inputIcon} />
                    <input type="text" placeholder="Username" style={styles.inputField} value={username} onChange={(e) => handleInputChange(setUsername, 'username', e.target.value)} required />
                </div>
                {formErrors.username && <p style={{ color: 'red', fontSize: '12px' }}>{formErrors.username}</p>}

                <div style={styles.inputGroup}>
                    <FaEnvelope style={styles.inputIcon} />
                    <input type="email" placeholder="Email id" style={styles.inputField} value={email} onChange={(e) => handleInputChange(setEmail, 'email', e.target.value)} required />
                </div>
                {formErrors.email && <p style={{ color: 'red', fontSize: '12px' }}>{formErrors.email}</p>}
                {/* You might want to display emailSuggestion here if it exists */}


                <div style={styles.passwordContainer}> {/* Your existing password input */}
                    <div style={{ ...styles.inputGroup, flexGrow: 1 }}>
                        <FaLock style={styles.inputIcon} />
                        <input type={showPassword ? 'text' : 'password'} placeholder="Password" style={styles.inputField} value={password} onChange={(e) => handleInputChange(setPassword, 'password', e.target.value)} required />
                        {showPassword ? <FaEyeSlash style={styles.passwordToggleIcon} onClick={() => setShowPassword(false)} /> : <FaEye style={styles.passwordToggleIcon} onClick={() => setShowPassword(true)} />}
                    </div>
                    {/* Fingerprint button - likely not used on registration */}
                </div>
                {formErrors.password && <p style={{ color: 'red', fontSize: '12px' }}>{formErrors.password}</p>}


                {/* Terms and Conditions */}
                <div style={styles.termsContainer}>
                    <input type="checkbox" id="terms" style={styles.checkbox} checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} />
                    <label htmlFor="terms"> I hereby agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" style={styles.link}>terms of services</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer" style={styles.link}>privacy policy</a> </label>
                </div>

                <button type="submit" style={styles.createAccountButton} disabled={submitState === PENDING_STATE}>
                    {submitState === PENDING_STATE ? 'Creating Account...' : 'Create Account'}
                </button>
            </form>

            <p style={styles.signInText}>
                Already have an account? <Link to="/login" style={styles.link}>Sign in</Link>
            </p>
        </div>
    );
};

export default MyCustomCreateAccountPage;