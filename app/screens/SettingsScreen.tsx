import { Text, View } from "react-native";
import Button from "../../src/components/Button";
import Card from "../../src/components/Card";
import { supabase } from "../../src/lib/supabase";

export default function Settings() {
  return (
    <View style={{ flex:1, backgroundColor:"#f6f8fb", padding:16 }}>
      <Card>
        <Text style={{ fontWeight:"800", color:"#111827", marginBottom:8 }}>Account</Text>
        <Button title="Sign out" onPress={() => supabase.auth.signOut()} />
      </Card>
      <Card>
        <Text style={{ fontWeight:"800", color:"#111827", marginBottom:6 }}>Flex 1 Pass</Text>
        <Text style={{ color:"#6b7280", marginBottom:8 }}>Email alerts and automation coming soon.</Text>
        <Button title="Upgrade (coming soon)" onPress={() => {}} />
      </Card>
    </View>
  );
}
