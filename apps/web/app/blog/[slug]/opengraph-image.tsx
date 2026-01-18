import { ImageResponse } from 'next/og';
import { loadOGFonts, OG_FONT_CONFIG } from '@/lib/og/fonts';
import { colors, OG_WIDTH, OG_HEIGHT, accentColors } from '@/lib/og/constants';
import { getBlogPostForOG } from '@/lib/og/data';

export const runtime = 'nodejs';
export const alt = 'Blog Post - Genwel';
export const size = { width: OG_WIDTH, height: OG_HEIGHT };
export const contentType = 'image/png';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function Image({ params }: Props) {
  const { slug } = await params;

  const [fonts, post] = await Promise.all([loadOGFonts(), getBlogPostForOG(slug)]);

  const [bold, semibold, regular] = fonts;

  // Fallback for missing post
  if (!post) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(145deg, ${colors.bgLight} 0%, ${colors.bgCream} 100%)`,
            fontFamily: OG_FONT_CONFIG.plusJakarta.name,
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              backgroundColor: colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
            }}
          >
            <span
              style={{
                fontSize: '48px',
                fontWeight: 700,
                color: colors.textLight,
              }}
            >
              G
            </span>
          </div>
          <span
            style={{
              fontSize: '32px',
              fontWeight: 600,
              color: colors.textSecondary,
            }}
          >
            Genwel Blog
          </span>
        </div>
      ),
      {
        ...size,
        fonts: [
          {
            name: OG_FONT_CONFIG.plusJakarta.name,
            data: bold,
            weight: 700,
            style: 'normal',
          },
          {
            name: OG_FONT_CONFIG.plusJakarta.name,
            data: semibold,
            weight: 600,
            style: 'normal',
          },
        ],
      }
    );
  }

  const formattedDate = new Date(post.publishedAt).toLocaleDateString('en-GB', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: `linear-gradient(145deg, ${colors.bgLight} 0%, ${colors.bgCream} 50%, #f0f5f5 100%)`,
          fontFamily: OG_FONT_CONFIG.plusJakarta.name,
          padding: '48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative accent stripe at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex',
            height: '6px',
          }}
        >
          {accentColors.map((color, i) => (
            <div key={i} style={{ flex: 1, backgroundColor: color }} />
          ))}
        </div>

        {/* Left side: Featured image */}
        {post.featuredImage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '380px',
              height: '100%',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '340px',
                height: '340px',
                backgroundColor: colors.bgWhite,
                borderRadius: '24px',
                boxShadow: '0 8px 32px rgba(26, 90, 90, 0.12)',
                padding: '16px',
                overflow: 'hidden',
              }}
            >
              <img
                src={post.featuredImage}
                alt={post.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '16px',
                }}
              />
            </div>
          </div>
        )}

        {/* Right side: Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            paddingLeft: post.featuredImage ? '40px' : '0',
            paddingRight: '24px',
            gap: '16px',
          }}
        >
          {/* Categories */}
          {post.categories.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {post.categories.slice(0, 2).map((category, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: `${colors.accent}25`,
                    color: colors.primaryDark,
                    padding: '6px 14px',
                    borderRadius: '100px',
                    fontSize: '14px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {category.title}
                </div>
              ))}
            </div>
          )}

          {/* Title */}
          <h1
            style={{
              fontSize: post.featuredImage ? '40px' : '48px',
              fontWeight: 700,
              color: colors.textPrimary,
              lineHeight: 1.15,
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p
              style={{
                fontSize: '20px',
                fontWeight: 400,
                color: colors.textSecondary,
                lineHeight: 1.4,
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {post.excerpt}
            </p>
          )}

          {/* Author & Meta */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginTop: '8px',
            }}
          >
            {post.author && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {post.author.image ? (
                  <img
                    src={post.author.image}
                    alt={post.author.name}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: colors.accent,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 700,
                      color: colors.primaryDark,
                    }}
                  >
                    {post.author.name.charAt(0)}
                  </div>
                )}
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: colors.textPrimary,
                  }}
                >
                  {post.author.name}
                </span>
              </div>
            )}

            <span
              style={{
                fontSize: '16px',
                color: colors.textMuted,
              }}
            >
              {formattedDate}
            </span>

            {post.readingTime && (
              <span
                style={{
                  fontSize: '16px',
                  color: colors.textMuted,
                }}
              >
                {post.readingTime} min read
              </span>
            )}
          </div>

          {/* Branding */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: 'auto',
              paddingTop: '16px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: colors.textLight,
                }}
              >
                G
              </span>
            </div>
            <span
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: colors.primary,
              }}
            >
              Genwel
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: OG_FONT_CONFIG.plusJakarta.name,
          data: bold,
          weight: 700,
          style: 'normal',
        },
        {
          name: OG_FONT_CONFIG.plusJakarta.name,
          data: semibold,
          weight: 600,
          style: 'normal',
        },
        {
          name: OG_FONT_CONFIG.plusJakarta.name,
          data: regular,
          weight: 400,
          style: 'normal',
        },
      ],
    }
  );
}
