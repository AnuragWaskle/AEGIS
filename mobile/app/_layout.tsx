import { Tabs } from 'expo-router';
import { useWebSocket } from '../hooks/useWebSocket';
import { Bell, BarChart2, FileText } from 'lucide-react-native';

export default function Layout() {
  useWebSocket();

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopColor: '#E2E8F0',
        borderTopWidth: 1,
      },
      tabBarActiveTintColor: '#059669',
      tabBarInactiveTintColor: '#94A3B8'
    }}>
      <Tabs.Screen 
        name="index" 
        options={{
          title: "Alerts",
          tabBarIcon: ({ color }) => <Bell size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="stats" 
        options={{
          title: "Stats",
          tabBarIcon: ({ color }) => <BarChart2 size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="audit" 
        options={{
          title: "Audit",
          tabBarIcon: ({ color }) => <FileText size={24} color={color} />
        }} 
      />
    </Tabs>
  );
}
