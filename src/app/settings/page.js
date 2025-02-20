"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ThemeSwitch } from "@/components/theme/theme-switch";
import { useSettingsStore } from "@/store/settings-store";

export default function SettingsPage() {
    const { settings, updateSetting, resetSettings } = useSettingsStore();

    return (
        <main className="p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">Settings</h1>

                <div className="space-y-6">
                    {/* Genel Ayarlar */}
                    <Card>
                        <CardHeader>
                            <CardTitle>General Settings</CardTitle>
                            <CardDescription>
                                Configure your general application preferences
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ThemeSwitch />
                            <div className="space-y-2">
                                <Label>Language</Label>
                                <Select
                                    value={settings.language}
                                    onValueChange={(value) =>
                                        updateSetting("language", value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en">
                                            English
                                        </SelectItem>
                                        <SelectItem value="tr">
                                            Turkish
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Feed Ayarları */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Feed Settings</CardTitle>
                            <CardDescription>
                                Customize your feed reading experience
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Update Interval</Label>
                                <Select
                                    value={settings.updateInterval}
                                    onValueChange={(value) =>
                                        updateSetting("updateInterval", value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select interval" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="15">
                                            Every 15 minutes
                                        </SelectItem>
                                        <SelectItem value="30">
                                            Every 30 minutes
                                        </SelectItem>
                                        <SelectItem value="60">
                                            Every hour
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Auto Mark as Read</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Automatically mark articles as read when
                                        opened
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.autoMarkAsRead}
                                    onCheckedChange={(checked) =>
                                        updateSetting("autoMarkAsRead", checked)
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bildirim Ayarları */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Settings</CardTitle>
                            <CardDescription>
                                Manage your notification preferences
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Push Notifications</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive notifications for new articles
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.pushNotifications}
                                    onCheckedChange={(checked) =>
                                        updateSetting(
                                            "pushNotifications",
                                            checked
                                        )
                                    }
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Email Notifications</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive daily digest emails
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.emailNotifications}
                                    onCheckedChange={(checked) =>
                                        updateSetting(
                                            "emailNotifications",
                                            checked
                                        )
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4">
                        <Button variant="outline" onClick={resetSettings}>
                            Reset to Defaults
                        </Button>
                        <Button>Save Changes</Button>
                    </div>
                </div>
            </div>
        </main>
    );
}
