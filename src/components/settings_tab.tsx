import {useEffect, useState} from 'react'
import {Switch} from "@/components/ui/switch"
import {Slider} from "@/components/ui/slider"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Button} from "@/components/ui/button"
import {Badge} from "@/components/ui/badge"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {TabPanel} from "@material-tailwind/react";
import {Clock, ExternalLink, Github, Info, Layers} from "lucide-react";
import {useDebounce} from "use-debounce";

interface Config {
    removeFromGroupOnDomainChange: boolean
    navigateToAlreadyOpenTab: boolean
    darkMode: boolean
    autoGroupTabs: boolean
    hibernationTime: number
    lastAccessedThreshold: number
    maxTabsPerGroup: number
}

export default function SettingsTab({value}: { value: string }) {
    const [config, setConfig] = useState<Config | null>(null);
    const [debouncedConfig] = useDebounce(config, 1000)
    useEffect(() => {
        const getConfig = async () => {
            try {
                const response = await chrome.runtime.sendMessage({type: 'fetchConfig'});
                if (response.status === 'success') {
                    setConfig(response.config);
                }
            } catch (error) {
                console.error("Error fetching config: ", error);
            }
        };
        getConfig().then(r => r);
    }, []);

    useEffect(() => {
        async function saveConfig() {
            try {
                const response = await chrome.runtime.sendMessage({type: 'updateConfig', payload: debouncedConfig});
                if (response.status === 'success') {
                    console.log("Config saved successfully");
                }
            } catch (error) {
                console.error("Error saving config: ", error);
            }
        }

        saveConfig().then(r => r);
    }, [debouncedConfig]);


    const handleToggle = (key: keyof Config) => {
        if (!config) return;
        setConfig(prev => prev ? {...prev, [key]: !prev[key]} : prev);
    }

    const handleSliderChange = (key: keyof Config, value: number[]) => {
        setConfig(prev => prev ? {...prev, [key]: value[0] } : prev);
    }

    const handleInputChange = (key: keyof Config, value: string) => {
        const parsedValue = parseInt(value, 10);
        setConfig(prev => prev ? {...prev, [key]: isNaN(parsedValue) ? 0 : parsedValue} : prev);
    }

    return (
        <TabPanel value={value} className={"h-full overflow-auto scrollbar-webkit"}>
            <div className="pb-2 max-w-2xl mx-auto">
                <Card className="mb-2 bg-white/50">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Layers className="w-5 h-5 mr-2"/> Tab Management
                        </CardTitle>
                        <CardDescription>Configure how tabs are managed in groups</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pl-8">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="removeFromGroup">Remove from group on url change</Label>
                            <Switch
                                id="removeFromGroup"
                                checked={config?.removeFromGroupOnDomainChange || false}
                                onCheckedChange={() => handleToggle('removeFromGroupOnDomainChange')}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="navigateToOpen">Navigate to already open tab</Label>
                            <Switch
                                id="navigateToOpen"
                                checked={config?.navigateToAlreadyOpenTab || false}
                                onCheckedChange={() => handleToggle('navigateToAlreadyOpenTab')}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="navigateToOpen">Auto Group Tabs</Label>
                            <Switch
                                id="navigateToOpen"
                                checked={config?.autoGroupTabs || false}
                                onCheckedChange={() => handleToggle('autoGroupTabs')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxTabs">Maximum tabs per group</Label>
                            <Input
                                id="maxTabs"
                                type="number"
                                value={config?.maxTabsPerGroup || 0}
                                onChange={(e) => handleInputChange('maxTabsPerGroup', e.target.value)}
                                min={1}
                                max={50}
                            />
                        </div>
                    </CardContent>
                </Card>
                <Card className="mb-2 bg-white/50">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Clock className="w-5 h-5 mr-2"/> Hibernation
                        </CardTitle>
                        <CardDescription>Set up automatic tab hibernation and Closing</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pl-8">
                        <div className="space-y-2">
                            <Label>Hibernate after inactivity (minutes)</Label>
                            <Slider
                                value={[(config?.hibernationTime || 0)  / 60000] }
                                onValueChange={(value) => handleSliderChange('hibernationTime', [value[0] * 60000])}
                                max={60}
                                step={1}
                            />
                            <div className="text-sm text-muted-foreground">{(config?.hibernationTime || 0) / 60000} minutes
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Close after inactivity (minutes)</Label>
                            <Slider
                                value={[(config?.lastAccessedThreshold || 0) / 60000]}
                                onValueChange={(value) => handleSliderChange('lastAccessedThreshold', [value[0] * 60000])}
                                max={60}
                                step={1}
                            />
                            <div
                                className="text-sm text-muted-foreground">{(config?.lastAccessedThreshold || 0) / 60000} minutes
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/50 mb-2 hover:shadow-md transition-shadow duration-300 cursor-default pt-2">
                    <CardHeader className="h-[30px] pt-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm flex items-center">
                            <Info className="w-4 h-4 mr-2"/>
                            About
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                            v1.0.0
                        </Badge>
                    </CardHeader>
                    <CardContent className="pl-8 space-y-3">
                        <div>
                            <a href="https://www.linkedin.com/in/ephraim-shikanga/"
                               className="text-sm font-medium hover:underline">
                                esTabs
                            </a>
                            <p className="font-thin text-xs text-muted-foreground">
                                Efficient tab management for your browser
                            </p>
                        </div>
                        <div className="space-y-2">
                            <a href="https://shikanga.vercel.app"
                               className="text-sm text-muted-foreground hover:text-primary flex items-center">
                                <ExternalLink className="w-4 h-4 mr-2"/>
                                Visit Website
                            </a>
                            <a href="https://github.com/EphraimShikanga/es_tabs"
                               className="text-sm text-muted-foreground hover:text-primary flex items-center">
                                <Github className="w-4 h-4 mr-2"/>
                                View on GitHub
                            </a>
                        </div>
                        <div className="pt-2">
                            <Button variant="outline" size="sm" className="w-full">
                                Check for Updates
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                {/*<div className="flex items-center justify-between">*/}
                {/*    <Label htmlFor="darkMode">Dark Mode</Label>*/}
                {/*    <Switch*/}
                {/*        id="darkMode"*/}
                {/*        checked={config.darkMode}*/}
                {/*        onCheckedChange={() => handleToggle('darkMode')}*/}
                {/*    />*/}
                {/*</div>*/}
            </div>
        </TabPanel>
    )
}