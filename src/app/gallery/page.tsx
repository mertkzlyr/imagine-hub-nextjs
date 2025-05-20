import Image from "next/image";

async function getPosts() {
    // Replace with your actual API endpoint
    const res = await fetch('http://localhost:5000/api/posts', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch posts');
    return res.json();
}

export default async function Gallery() {
    const posts = await getPosts();

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Gallery</h1>
                <div className="flex gap-4">
                    <select className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        <option>Most Recent</option>
                        <option>Most Liked</option>
                        <option>Most Viewed</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {posts.map((post: any) => (
                    <div key={post.id} className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <Image
                            src={`http://localhost:5000/post_pics/${post.imageUrl}`}
                            alt={post.title || 'AI Generated Art'}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                <h3 className="font-semibold truncate">{post.title}</h3>
                                <p className="text-sm text-gray-200 truncate">by {post.authorName}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 