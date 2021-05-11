import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import { formatDate } from '../../utils/format';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  const postFormatted = {
    ...post,
    first_publication_date: formatDate(post?.first_publication_date),
  };

  return (
    <>
      {router.isFallback && 'Carregando...'}

      <Head>
        <title>{postFormatted.data.title} | Spacetraveling</title>
      </Head>

      <main className={styles.postContainer}>
        <img
          src={postFormatted.data.banner.url}
          alt={postFormatted.data.title}
        />

        <div className={styles.postContent}>
          <h1>{postFormatted.data.title}</h1>

          <section className={`${commonStyles.info} ${styles.info}`}>
            <time>
              <FiCalendar />
              {postFormatted.first_publication_date}
            </time>

            <span>
              <FiUser />
              {postFormatted.data.author}
            </span>

            <time>
              <FiClock />4 min
            </time>
          </section>

          {postFormatted.data.content.map(content => (
            <article className={styles.post} key={content.heading}>
              <header>{content.heading}</header>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </article>
          ))}
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      fetch: ['post.tile', 'post.subtile', 'post.author'],
    }
  );

  return {
    paths: posts.results.map(post => {
      return {
        params: { slug: post.uid },
      };
    }),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response?.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 60 * 24 * 7, // one time per week
  };
};
