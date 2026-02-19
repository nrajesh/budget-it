import { ArrowRight, Heart, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    ThemedCard,
    ThemedCardContent,
    ThemedCardDescription,
    ThemedCardHeader,
    ThemedCardTitle,
} from "@/components/ThemedCard";
import { Badge } from "@/components/ui/badge";

export default function DonationPage() {
    return (
        <div className="flex-1 space-y-6 p-6 rounded-xl min-h-[calc(100vh-100px)] transition-all duration-500 bg-slate-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-slate-900 dark:to-black">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
                        Donate
                    </h1>
                    <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">
                        If you find this project useful, consider supporting its development. Your contribution helps keep the lights on and the code flowing.
                    </p>
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:gap-12 items-start">
                {/* Github Sponsors */}
                <ThemedCard className="border-pink-200 bg-pink-50/50 dark:border-pink-900/50 dark:bg-pink-950/20 h-full">
                    <ThemedCardHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 hover:bg-pink-100 hover:text-pink-700">
                                Monthly Support
                            </Badge>
                        </div>
                        <ThemedCardTitle className="flex items-center gap-3 text-2xl text-pink-900 dark:text-pink-100">
                            <Heart className="h-6 w-6 text-pink-500 fill-pink-500" />
                            Github Sponsors
                        </ThemedCardTitle>
                        <ThemedCardDescription>
                            Become a sponsor on Github to support my open source work continuously.
                        </ThemedCardDescription>
                    </ThemedCardHeader>
                    <ThemedCardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            Github Sponsors is the best way to support ongoing development. You can choose a one-time or monthly tier.
                        </p>
                        <ul className="space-y-2 text-sm text-foreground/80">
                            <li className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                                Special badge on your Github profile
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                                Priority support for issues
                            </li>
                        </ul>
                        <div className="pt-4">
                            <Button size="lg" className="w-full gap-2 group bg-pink-600 hover:bg-pink-700 text-white border-none" asChild>
                                <a
                                    href="https://github.com/sponsors/nrajesh"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Sponsor on Github
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </a>
                            </Button>
                        </div>
                    </ThemedCardContent>
                </ThemedCard>

                {/* Direct Donation (QR Codes) */}
                <ThemedCard className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20 h-full">
                    <ThemedCardHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-100 hover:text-emerald-700">
                                Direct Contribution
                            </Badge>
                        </div>
                        <ThemedCardTitle className="flex items-center gap-3 text-2xl text-emerald-900 dark:text-emerald-100">
                            <Smartphone className="h-6 w-6 text-emerald-600" />
                            Scan to Pay
                        </ThemedCardTitle>
                        <ThemedCardDescription>
                            Directly support via Bank Transfer or PayPal using the QR code below.
                        </ThemedCardDescription>
                    </ThemedCardHeader>
                    <ThemedCardContent className="flex flex-col items-center space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full">
                            <div className="flex flex-col items-center gap-3">
                                <span className="font-semibold text-lg text-emerald-800 dark:text-emerald-200">Revolut</span>
                                <div className="relative group cursor-pointer overflow-hidden rounded-xl border border-border shadow-sm bg-white p-2">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <img
                                        src="/assets/qrcode_revolut.png"
                                        alt="Revolut QR Code"
                                        className="w-48 h-48 object-contain transition-transform duration-500 group-hover:scale-105"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-3">
                                <span className="font-semibold text-lg text-emerald-800 dark:text-emerald-200">PayPal</span>
                                <div className="relative group cursor-pointer overflow-hidden rounded-xl border border-border shadow-sm bg-white p-2">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <img
                                        src="/assets/qrcode_paypal.png"
                                        alt="PayPal QR Code"
                                        className="w-48 h-48 object-contain transition-transform duration-500 group-hover:scale-105"
                                    />
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-center text-muted-foreground max-w-xs mt-4">
                            Scan with your banking app or PayPal to send a donation directly.
                        </p>
                    </ThemedCardContent>
                </ThemedCard>
            </div>
        </div>
    );
}
