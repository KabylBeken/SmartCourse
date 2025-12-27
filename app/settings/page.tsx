"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { User, Bell, Shield, Brain, Save, Loader2 } from "lucide-react"

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const [profile, setProfile] = useState({
    name: "Dr. Jane Smith",
    email: "jane.smith@university.edu",
    department: "Computer Science",
  })

  const [notifications, setNotifications] = useState({
    email_submissions: true,
    email_grades: true,
    push_submissions: false,
    push_reminders: true,
  })

  const [aiSettings, setAISettings] = useState({
    auto_evaluate: true,
    require_review: true,
    confidence_threshold: 0.8,
  })

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    toast({ title: "Settings saved", description: "Your preferences have been updated." })
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Brain className="h-4 w-4" />
              AI Settings
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="p-6">
              <h2 className="mb-6 text-lg font-semibold">Profile Information</h2>
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={profile.department}
                    onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="p-6">
              <h2 className="mb-6 text-lg font-semibold">Notification Preferences</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="mb-4 text-sm font-medium">Email Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>New Submissions</Label>
                        <p className="text-sm text-muted-foreground">Get notified when students submit work</p>
                      </div>
                      <Switch
                        checked={notifications.email_submissions}
                        onCheckedChange={(checked) => setNotifications((n) => ({ ...n, email_submissions: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Grade Published</Label>
                        <p className="text-sm text-muted-foreground">Confirmation when grades are published</p>
                      </div>
                      <Switch
                        checked={notifications.email_grades}
                        onCheckedChange={(checked) => setNotifications((n) => ({ ...n, email_grades: checked }))}
                      />
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="mb-4 text-sm font-medium">Push Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Submission Alerts</Label>
                        <p className="text-sm text-muted-foreground">Real-time alerts for submissions</p>
                      </div>
                      <Switch
                        checked={notifications.push_submissions}
                        onCheckedChange={(checked) => setNotifications((n) => ({ ...n, push_submissions: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Due Date Reminders</Label>
                        <p className="text-sm text-muted-foreground">Reminders before assignment deadlines</p>
                      </div>
                      <Switch
                        checked={notifications.push_reminders}
                        onCheckedChange={(checked) => setNotifications((n) => ({ ...n, push_reminders: checked }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="ai">
            <Card className="p-6">
              <h2 className="mb-6 text-lg font-semibold">AI Evaluation Settings</h2>
              <div className="space-y-6 max-w-md">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Evaluate Submissions</Label>
                    <p className="text-sm text-muted-foreground">Automatically run AI evaluation on new submissions</p>
                  </div>
                  <Switch
                    checked={aiSettings.auto_evaluate}
                    onCheckedChange={(checked) => setAISettings((a) => ({ ...a, auto_evaluate: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Manual Review</Label>
                    <p className="text-sm text-muted-foreground">AI scores must be reviewed before publishing</p>
                  </div>
                  <Switch
                    checked={aiSettings.require_review}
                    onCheckedChange={(checked) => setAISettings((a) => ({ ...a, require_review: checked }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confidence Threshold</Label>
                  <p className="text-sm text-muted-foreground">
                    Minimum AI confidence level to auto-accept scores (current: {aiSettings.confidence_threshold * 100}
                    %)
                  </p>
                  <Input
                    type="range"
                    min="0.5"
                    max="1"
                    step="0.05"
                    value={aiSettings.confidence_threshold}
                    onChange={(e) =>
                      setAISettings((a) => ({ ...a, confidence_threshold: Number.parseFloat(e.target.value) }))
                    }
                    className="w-full"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="p-6">
              <h2 className="mb-6 text-lg font-semibold">Security Settings</h2>
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                <Button variant="outline" className="bg-transparent">
                  Change Password
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
