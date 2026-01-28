import { Metadata } from 'next';

// Prevent this page from being indexed by search engines
export const metadata: Metadata = {
    title: 'Coming Soon - DealPing',
    robots: {
        index: false,
        follow: false,
        googleBot: {
            index: false,
            follow: false,
        },
    },
};

export default function ComingSoonLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
