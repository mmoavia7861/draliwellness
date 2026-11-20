import React from 'react';
import { useStore } from '../context/StoreContext';
import { PageMeta } from '../components/PageMeta';

export const JournalPage: React.FC = () => {
  const { journalPosts, siteSettings } = useStore();
  const published = journalPosts.filter((p) => p.published);

  return (
    <>
      <PageMeta
        title={`Health Journal — ${siteSettings.businessName}`}
        description="Educational articles on daily nutrition, supplement literacy, and healthy habits."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="space-y-2 border-b border-[#174D40]/12 pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C7A46A]">
            Educational Resources
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#174D40]">
            Health Journal
          </h1>
          <p className="text-sm text-[#252B29]/75">
            Reviewed wellness guides published by our team. Educational content only — not a substitute for personal medical advice.
          </p>
        </div>

        {published.length === 0 ? (
          <div className="bg-white border border-[#174D40]/12 rounded-2xl p-12 text-center space-y-2">
            <h2 className="font-serif text-2xl font-semibold text-[#174D40]">
              Editorial Articles Launching Soon
            </h2>
            <p className="text-sm text-[#252B29]/75 max-w-md mx-auto">
              Verified nutrition and supplement literacy articles will appear here as our editorial team publishes them in the Admin Dashboard.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {published.map((post) => (
              <article
                key={post.id}
                className="bg-white border border-[#174D40]/12 rounded-2xl p-6 sm:p-8 space-y-3"
              >
                <p className="text-xs text-[#252B29]/60">
                  {[post.category, post.authorName, post.publishedAt].filter(Boolean).join(' · ')}
                </p>
                <h2 className="font-serif text-2xl font-semibold text-[#174D40]">{post.title}</h2>
                {post.summary && (
                  <p className="text-sm font-medium text-[#252B29]/85">{post.summary}</p>
                )}
                {post.content && (
                  <p className="text-sm text-[#252B29]/75 leading-relaxed whitespace-pre-line pt-2">
                    {post.content}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
