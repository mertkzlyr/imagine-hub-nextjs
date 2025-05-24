'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { postService } from "@/services/post";
import { Post, PostDetail } from "@/services/types";
import { IMAGE_CONFIG } from "@/config";
import PostModal from "@/components/PostModal";
import { useToast } from "@/components/ToastProvider";
import { commentService } from "@/services/comment";

export default function Home() {
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<PostDetail | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    const fetchFeaturedPosts = async () => {
      try {
        const response = await postService.getAllPosts(1, 3);
        if (response.success && response.data) {
          setFeaturedPosts(response.data);
        }
      } catch (error) {
        console.error('Error fetching featured posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedPosts();
  }, []);

  const handlePostClick = async (postId: string) => {
    try {
      const response = await postService.getPostById(postId);
      if (response.success && response.data) {
        setSelectedPost(response.data);
      } else {
        showToast('Failed to load post details', 'error');
      }
    } catch (error) {
      console.error('Error fetching post details:', error);
      showToast('Failed to load post details', 'error');
    }
  };

  const handleLikePost = async () => {
    if (!selectedPost) return;
    try {
      const response = await postService.likePost(selectedPost.id);
      if (response.success) {
        const updatedPost = await postService.getPostById(selectedPost.id);
        if (updatedPost.success && updatedPost.data) {
          setSelectedPost(updatedPost.data);
        }
      }
    } catch (error) {
      showToast('Failed to like post', 'error');
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!selectedPost) return;
    try {
      const response = await commentService.likeComment(commentId);
      if (response.success) {
        const updatedPost = await postService.getPostById(selectedPost.id);
        if (updatedPost.success && updatedPost.data) {
          setSelectedPost(updatedPost.data);
        }
      }
    } catch (error) {
      showToast('Failed to like comment', 'error');
    }
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !newComment.trim()) return;
    try {
      const response = await commentService.createComment({
        postId: selectedPost.id,
        comment: newComment.trim()
      });
      if (response.success) {
        const updatedPost = await postService.getPostById(selectedPost.id);
        if (updatedPost.success && updatedPost.data) {
          setSelectedPost(updatedPost.data);
        }
        setNewComment('');
      } else if (response.message === 'You need to log in to continue.') {
        showToast('You must be logged in to comment.', 'error');
      } else {
        showToast('Failed to create comment', 'error');
      }
    } catch (error) {
      showToast('Failed to create comment', 'error');
    }
  };

  const handleReplySubmit = async (parentId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !replyText.trim()) return;
    try {
      const response = await commentService.createComment({
        postId: selectedPost.id,
        comment: replyText.trim(),
        parentId,
      });
      if (response.success) {
        const updatedPost = await postService.getPostById(selectedPost.id);
        if (updatedPost.success && updatedPost.data) {
          setSelectedPost(updatedPost.data);
        }
        setReplyText('');
        setReplyingTo(null);
      } else if (response.message === 'You need to log in to continue.') {
        showToast('You must be logged in to comment.', 'error');
      } else {
        showToast('Failed to reply to comment', 'error');
      }
    } catch (error) {
      showToast('Failed to reply to comment', 'error');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedPost) return;
    try {
      await commentService.deleteComment(commentId);
      const updatedPost = await postService.getPostById(selectedPost.id);
      if (updatedPost.success && updatedPost.data) {
        setSelectedPost(updatedPost.data);
      }
    } catch (error) {
      showToast('Failed to delete comment', 'error');
    }
  };

  const handleUpdatePost = async () => {
    if (!selectedPost || !selectedPost.description) return;
    try {
      const response = await postService.updateDescription({
        postId: selectedPost.id,
        description: selectedPost.description
      });
      if (response.success) {
        const updatedPost = await postService.getPostById(selectedPost.id);
        if (updatedPost.success && updatedPost.data) {
          setSelectedPost(updatedPost.data);
        }
      }
    } catch (error) {
      showToast('Failed to update post', 'error');
    }
  };

  const handleDeletePost = async () => {
    if (!selectedPost) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5169/api'}/Post/posts/${selectedPost.id}`, {
        method: 'DELETE',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        showToast('Post deleted successfully.', 'success');
        setSelectedPost(null);
        setFeaturedPosts(posts => posts.filter(p => p.id !== selectedPost.id));
      } else {
        showToast(data.message || 'Failed to delete post', 'error');
      }
    } catch (err) {
      showToast('Failed to delete post', 'error');
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Create and Share Your AI Art
        </h1>
        <p className="text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
          Join ImagineHub to create stunning AI-generated art and share your creations with a community of artists and enthusiasts.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/create"
            className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Create Art
          </Link>
          <Link
            href="/gallery"
            className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Browse Gallery
          </Link>
        </div>
      </section>

      {/* Featured Images Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Featured Creations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 animate-pulse shadow-lg"
              />
            ))
          ) : featuredPosts.length > 0 ? (
            featuredPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => handlePostClick(post.id)}
                className="group relative aspect-square rounded-lg overflow-hidden bg-white hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100"
              >
                <Image
                  src={`${IMAGE_CONFIG.POST_PICTURE_URL}/${post.imageUrl}`}
                  alt={post.description || 'Featured creation'}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={post.profilePicture ? `${IMAGE_CONFIG.PROFILE_PICTURE_URL}/${post.profilePicture}` : '/default-avatar.png'}
                        alt={post.username}
                        className="w-8 h-8 rounded-full object-cover border-2 border-white"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-avatar.png';
                        }}
                      />
                      <span className="text-sm font-medium">{post.username}</span>
                    </div>
                    <p className="text-sm line-clamp-2">{post.description}</p>
                    <div className="flex gap-4 text-xs text-gray-200 mt-2">
                      <span>{post.likeCount} likes</span>
                      <span>{post.commentCount} comments</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center text-gray-500 py-8">
              No featured posts available
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-blue-600 text-xl font-bold">1</span>
            </div>
            <h3 className="text-lg font-semibold">Create</h3>
            <p className="text-gray-600">
              Use our AI tools to generate unique artwork from your descriptions
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-blue-600 text-xl font-bold">2</span>
            </div>
            <h3 className="text-lg font-semibold">Share</h3>
            <p className="text-gray-600">
              Upload your creations to the gallery for others to see
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-blue-600 text-xl font-bold">3</span>
            </div>
            <h3 className="text-lg font-semibold">Connect</h3>
            <p className="text-gray-600">
              Join a community of artists and art enthusiasts
            </p>
          </div>
        </div>
      </section>

      {/* Post Modal */}
      <PostModal
        isOpen={!!selectedPost}
        onClose={() => {
          setSelectedPost(null);
          setNewComment('');
          setReplyingTo(null);
          setReplyText('');
        }}
        post={selectedPost}
        currentUserId={typeof window !== 'undefined' ? Number(localStorage.getItem('userId')) : null}
        onLikePost={handleLikePost}
        onLikeComment={handleLikeComment}
        onCreateComment={handleCreateComment}
        onReplySubmit={handleReplySubmit}
        onDeleteComment={handleDeleteComment}
        onUpdatePost={handleUpdatePost}
        onDeletePost={handleDeletePost}
        loading={false}
        error={null}
        showToast={showToast}
        newComment={newComment}
        setNewComment={setNewComment}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        replyText={replyText}
        setReplyText={setReplyText}
      />
    </div>
  );
}
