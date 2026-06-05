import { Tabs } from 'expo-router';
import { useWebSocket } from '../hooks/useWebSocket';
import { Bell, BarChart2, FileText, Lock, ShieldAlert } from 'lucide-react-native';

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
      tabBarActiveTintColor: '#00FF88',
      tabBarInactiveTintColor: '#445566'
    }}>
      <Tabs.Screen 
        name="index" 
        options={{
          title: "Alerts",
          tabBarIcon: ({ color }) => <Bell size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="memory" 
        options={{
          title: "Memory",
          tabBarIcon: ({ color }) => <Lock size={24} color={color} />
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
        name="intel" 
        options={{
          title: "Intel",
          tabBarIcon: ({ color }) => <ShieldAlert size={24} color={color} />
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
