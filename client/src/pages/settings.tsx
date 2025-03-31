import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/ui/theme-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [apiKey, setApiKey] = useState("");
  
  const handleSaveApiKey = () => {
    toast({
      title: "API Key Saved",
      description: "Your API key has been updated successfully.",
    });
  };
  
  return (
    <>
      <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <button className="md:hidden text-gray-500 dark:text-gray-400">
            <i className="ri-menu-line text-xl"></i>
          </button>
          <h2 className="text-lg font-medium">Settings</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <i className="ri-notification-3-line"></i>
          </button>
          <button className="w-8 h-8 flex items-center justify-center bg-primary-100 dark:bg-primary-900/50 rounded-full text-primary-600 dark:text-primary-400">
            <span className="text-sm font-medium">JD</span>
          </button>
        </div>
      </header>
      
      <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Theme</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Choose your preferred theme
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      className={`px-4 py-2 rounded ${
                        theme === "light" 
                          ? "bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 font-medium" 
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      }`}
                      onClick={() => setTheme("light")}
                    >
                      Light
                    </button>
                    <button 
                      className={`px-4 py-2 rounded ${
                        theme === "dark" 
                          ? "bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 font-medium" 
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      }`}
                      onClick={() => setTheme("dark")}
                    >
                      Dark
                    </button>
                    <button 
                      className={`px-4 py-2 rounded ${
                        theme === "system" 
                          ? "bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 font-medium" 
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      }`}
                      onClick={() => setTheme("system")}
                    >
                      System
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive notifications about new trending products
                    </p>
                  </div>
                  <div>
                    <Switch 
                      checked={emailNotifications} 
                      onCheckedChange={setEmailNotifications} 
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Daily Digest</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive a daily summary of top trending products
                    </p>
                  </div>
                  <div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="apiKey">API Key</Label>
                  <div className="flex gap-2 mt-1">
                    <Input 
                      id="apiKey" 
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your API key" 
                    />
                    <Button onClick={handleSaveApiKey}>Save</Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Used to connect with external data sources
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
