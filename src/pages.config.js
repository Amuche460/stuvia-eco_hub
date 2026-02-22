/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminDashboard from './pages/AdminDashboard';
import Donate from './pages/Donate';
import Home from './pages/Home';
import NesaCalendar from './pages/NesaCalendar';
import PayDues from './pages/PayDues';
import PaymentHistory from './pages/PaymentHistory';
import Register from './pages/Register';
import SignIn from './pages/SignIn';
import Splash from './pages/Splash';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfileDetail from './pages/StudentProfileDetail';
import StudentProfiles from './pages/StudentProfiles';
import Suggestions from './pages/Suggestions';
import UpdateProfile from './pages/UpdateProfile';
import VerifyOtp from './pages/VerifyOtp';
import RegisterExecutive from './pages/RegisterExecutive';
import RegisterStaff from './pages/RegisterStaff';
import ExecutiveSignIn from './pages/ExecutiveSignIn';
import ExecutiveVerifyOtp from './pages/ExecutiveVerifyOtp';
import StaffSignIn from './pages/StaffSignIn';
import StaffVerifyOtp from './pages/StaffVerifyOtp';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "Donate": Donate,
    "Home": Home,
    "NesaCalendar": NesaCalendar,
    "PayDues": PayDues,
    "PaymentHistory": PaymentHistory,
    "Register": Register,
    "SignIn": SignIn,
    "Splash": Splash,
    "StudentDashboard": StudentDashboard,
    "StudentProfileDetail": StudentProfileDetail,
    "StudentProfiles": StudentProfiles,
    "Suggestions": Suggestions,
    "UpdateProfile": UpdateProfile,
    "VerifyOtp": VerifyOtp,
    "RegisterExecutive": RegisterExecutive,
    "RegisterStaff": RegisterStaff,
    "ExecutiveSignIn": ExecutiveSignIn,
    "ExecutiveVerifyOtp": ExecutiveVerifyOtp,
    "StaffSignIn": StaffSignIn,
    "StaffVerifyOtp": StaffVerifyOtp,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};