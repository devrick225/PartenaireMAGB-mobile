import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useDS } from "../design/components";
import { fonts } from "../design/tokens";

// Main App Screens
import Dashboard from "../screens/Dashboard";
import DashboardModern from "../screens/DashboardModern";

// Deep Link Handler
import DeepLinkHandler from "../components/DeepLinkHandler";

// Profile & Settings
import ProfileScreen from "../screens/ProfileScreen";
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
import PaymentWebViewScreen from "../screens/PaymentWebViewScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Barre d'onglets du bas — mêmes entrées que la navigation mobile du site (frontend-new)
const TABS = [
  { name: "Dashboard", component: DashboardModern, label: "Accueil", icon: "home" },
  { name: "DonationHistory", component: DonationHistoryScreen, label: "Dons", icon: "heart" },
  { name: "PaymentHistory", component: PaymentHistoryScreen, label: "Paiements", icon: "wallet" },
  { name: "TicketList", component: TicketListScreen, label: "Support", icon: "chatbubbles" },
  { name: "Profile", component: ProfileScreen, label: "Profil", icon: "person" },
];

const MainTabs = () => {
  const { c } = useDS();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tab = TABS.find((t) => t.name === route.name);
        return {
          headerShown: false,
          tabBarActiveTintColor: c.primary,
          tabBarInactiveTintColor: c.mutedForeground,
          tabBarStyle: { backgroundColor: c.card, borderTopColor: c.border },
          tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11 },
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? tab.icon : `${tab.icon}-outline`} size={size - 2} color={color} />
          ),
          tabBarAccessibilityLabel: tab?.label,
        };
      }}
    >
      {TABS.map((t) => (
        // asTab : l'écran est une racine d'onglet (pas de bouton retour dans son en-tête)
        <Tab.Screen key={t.name} name={t.name} component={t.component} options={{ title: t.label }} initialParams={{ asTab: true }} />
      ))}
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <>
      <DeepLinkHandler />
      <Stack.Navigator
        initialRouteName="Main"
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          animation: 'slide_from_right',
        }}
      >
        {/* Onglets principaux : Accueil, Dons, Paiements, Support, Profil */}
        <Stack.Screen name="Main" component={MainTabs} />

        {/* Profile & Settings */}
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />

        {/* Verification Screens */}
        <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
        <Stack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />

        {/* Support & Help */}
        <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
        <Stack.Screen name="ContactSupport" component={ContactSupportScreen} />
        <Stack.Screen name="TicketDetail" component={TicketDetailScreen} />

        {/* Donations */}
        <Stack.Screen name="DonationDetail" component={DonationDetailScreen} />
        <Stack.Screen name="CreateDonation" component={CreateDonationScreen} />
        <Stack.Screen name="RecurringDonations" component={RecurringDonationsScreen} />

        {/* Payments */}
        <Stack.Screen name="PaymentVerification" component={PaymentVerificationScreen} />
        <Stack.Screen name="PaymentManagement" component={PaymentManagementScreen} />

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

        {/* Paiement WebView — page de paiement intégrée */}
        <Stack.Screen
          name="PaymentWebView"
          component={PaymentWebViewScreen}
          options={{ gestureEnabled: false }} // Empêcher le swipe back pendant le paiement
        />
      </Stack.Navigator>
    </>
  );
};

export default AppNavigator;