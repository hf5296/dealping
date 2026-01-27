import Link from "next/link";

interface CategoryCardProps {
    name: string;
    slug: string;
    icon: string;
    productCount: number;
    color: string;
}

export default function CategoryCard({
    name,
    slug,
    icon,
    productCount,
    color,
}: CategoryCardProps) {
    return (
        <Link href={`/categories/${slug}`}>
            <div
                className="card-hover group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-8
          dark:border-gray-700 dark:bg-gray-800"
            >
                {/* Background gradient accent */}
                <div
                    className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-20 transition-opacity
            group-hover:opacity-30"
                    style={{ backgroundColor: color }}
                />

                {/* Icon */}
                <div
                    className="mb-5 flex h-16 w-16 items-center justify-center rounded-xl text-3xl"
                    style={{ backgroundColor: `${color}15` }}
                >
                    {icon}
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {name}
                </h3>

                {/* Arrow indicator */}
                <div
                    className="absolute bottom-6 right-6 flex h-8 w-8 items-center justify-center rounded-full 
            bg-gray-100 text-gray-400 transition-all group-hover:bg-emerald-500 group-hover:text-white 
            dark:bg-gray-700"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </Link>
    );
}
