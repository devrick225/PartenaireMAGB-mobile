import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Main App Screens
import Dashboard from "../screens/Dashboard";
import DashboardModern from "../screens/DashboardModern";

// Deep Link Handler
import DeepLinkHandler from "../components/DeepLinkHandler";

// Profile & Settings
import ProfileScreen from "../screens/ProfileScreen";
import ProfileWizardScreen from "../screens/ProfileWizardScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ChangePasswordScreen from "../screens/ChangePasswordScreen";

// Support & Help
import HelpCenterScreen from "../screens/HelpCenterScreen";
import ContactSupportScreen from "../screens/ContactSupportScreen";
import TicketListScreen from "../screens/TicketListScreen";
import TicketDetailScreen from "../screens/TicketDetailScreen";

// Donations & Payments
import DonationHistoryScreen from "../screens/DonationHistoryScreen";
import DonationDetailScreen from "../screens/DonationDetailScreen";
import CreateDonationScreen from "../screens/CreateDonationScreen";
import PaymentVerificationScreen from "../screens/PaymentVerificationScreen";
import PaymentManagementScreen from "../screens/PaymentManagementScreen";
import PaymentHistoryScreen from "../screens/PaymentHistoryScreen";
import RecurringDonationsScreen from "../screens/RecurringDonationsScreen";

// Verification Screens
import EmailVerificationScreen from "../screens/EmailVerificationScreen";
import PhoneVerificationScreen from "../screens/PhoneVerificationScreen";

// Privacy Policy
import PrivacyPolicyScreen from "../screens/PrivacyPolicyScreen";

// Profile Image
import ProfileImageScreen from "../screens/ProfileImageScreen";

// Documents
import DocumentsScreen from "../screens/DocumentsScreen";
import EditProfileScreen from "../screens/EditProfileScreen";

// Ministries
import MinistryScreen from "../screens/MinistryScreen";
import MinistryDetailScreen from "../screens/MinistryDetailScreen";

// Social Media
import SocialMediaScreen from "../screens/SocialMediaScreen";

// Missions
import MissionsScreen from "../screens/MissionsScreen";

// Contact Ministere
import ContactMinistere from "../screens/ContactMinistereSimple";
import DashboardGrid from "../screens/DashboardGrid";
import DashboardGridModern from "../screens/DashboardGridModern";
import CreateDonationScreenModern from "../screens/CreateDonationScreenModern";
import DashboardVisual from "../screens/DashboardVisual";
import DashboardScreen from "../screens/DashboardScreen";
import DashboardSelector from "../screens/DashboardSelector";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <>
      <DeepLinkHandler />
      <Stack.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          animation: 'slide_from_right',
        }}
      >
        {/* Main Dashboard */}
        <Stack.Screen name="Dashboard" component={DashboardModern} />
        <Stack.Screen name="DashboardOld" component={DashboardVisual} />

        {/* Profile & Settings */}
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="ProfileWizard" component={ProfileWizardScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />

        {/* Verification Screens */}
        <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
        <Stack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />

        {/* Support & Help */}
        <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
        <Stack.Screen name="ContactSupport" component={ContactSupportScreen} />
        <Stack.Screen name="TicketList" component={TicketListScreen} />
        <Stack.Screen name="TicketDetail" component={TicketDetailScreen} />

        {/* Donations */}
        <Stack.Screen name="DonationHistory" component={DonationHistoryScreen} />
        <Stack.Screen name="DonationDetail" component={DonationDetailScreen} />
        <Stack.Screen name="CreateDonation" component={CreateDonationScreen} />
        <Stack.Screen name="RecurringDonations" component={RecurringDonationsScreen} />

        {/* Payments */}
        <Stack.Screen name="PaymentVerification" component={PaymentVerificationScreen} />
        <Stack.Screen name="PaymentManagement" component={PaymentManagementScreen} />
        <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />

        {/* Privacy Policy */}
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />

        {/* Profile Image */}
        <Stack.Screen name="ProfileImage" component={ProfileImageScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />

        {/* Ministries */}
        <Stack.Screen name="Ministry" component={MinistryScreen} />
        <Stack.Screen name="MinistryDetail" component={MinistryDetailScreen} />

        {/* Social Media */}
        <Stack.Screen name="SocialMedia" component={SocialMediaScreen} />

        {/* Missions */}
        <Stack.Screen name="Missions" component={MissionsScreen} />

        {/* Contact Ministere */}
        <Stack.Screen name="ContactMinistere" component={ContactMinistere} />

        {/* Documents */}
        <Stack.Screen name="Documents" component={DocumentsScreen} />
      </Stack.Navigator>
    </>
  );
};

export default AppNavigator;