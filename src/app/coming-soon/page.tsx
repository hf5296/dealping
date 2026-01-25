'use client';

export default function ComingSoonPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative z-10 text-center max-w-2xl mx-auto">
                {/* Logo */}
                <div className="mb-8">
                    <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                        DealPing
                    </h1>
                </div>

                {/* Main message */}
                <div className="mb-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Something Amazing is Coming
                    </h2>
                    <p className="text-lg text-gray-300 leading-relaxed">
                        We're working hard to bring you the best deals from across the UK.
                        Our price comparison platform will help you save money on everything
                        from electronics to everyday essentials.
                    </p>
                </div>

                {/* Features preview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <div className="text-3xl mb-2">🔔</div>
                        <h3 className="text-white font-semibold mb-1">Price Alerts</h3>
                        <p className="text-gray-400 text-sm">Get notified when prices drop</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <div className="text-3xl mb-2">📊</div>
                        <h3 className="text-white font-semibold mb-1">Price History</h3>
                        <p className="text-gray-400 text-sm">Track prices over time</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <div className="text-3xl mb-2">🏷️</div>
                        <h3 className="text-white font-semibold mb-1">Best Deals</h3>
                        <p className="text-gray-400 text-sm">Curated deals just for you</p>
                    </div>
                </div>

                {/* Email signup placeholder */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <p className="text-gray-300 mb-4">
                        Want to be notified when we launch?
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            disabled
                        />
                        <button
                            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg opacity-50 cursor-not-allowed"
                            disabled
                        >
                            Notify Me
                        </button>
                    </div>
                    <p className="text-gray-500 text-sm mt-3">
                        Email signup coming soon!
                    </p>
                </div>

                {/* Footer */}
                <div className="mt-10 text-gray-500 text-sm">
                    <p>© 2025 DealPing. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}
