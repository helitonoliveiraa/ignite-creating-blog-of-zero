import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { formatDate } from '../utils/format';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const postFormatted = {
    ...postsPagination,
    results: postsPagination.results.map(post => {
      return {
        ...post,
        first_publication_date: formatDate(post.first_publication_date),
      };
    }),
  };

  const [postsReult, setPostsResult] = useState(postFormatted);
  const [loading, setLoading] = useState(false);

  function handleNextPage(): void {
    setLoading(true);

    fetch(`${postFormatted.next_page}`)
      .then(response => response.json())
      .then((data: PostPagination) => {
        const nextPosts = data.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: formatDate(post.first_publication_date),
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        });

        const nextPostsPagination = {
          next_page: data.next_page,
          results: nextPosts,
        };

        setPostsResult({
          ...postsReult,
          next_page: nextPostsPagination.next_page,
          results: [...postsReult.results, ...nextPostsPagination.results],
        });

        setLoading(false);
      });
  }

  return (
    <>
      <Head>
        <title>Home | Spacetraveling</title>
      </Head>

      <main className={styles.container}>
        <div className={styles.content}>
          {postsReult.results.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>

                <div className={commonStyles.info}>
                  <time>
                    <FiCalendar />
                    {post.first_publication_date}
                  </time>

                  <span>
                    <FiUser />
                    {post.data.author}
                  </span>
                </div>
              </a>
            </Link>
          ))}

          {postsReult.next_page && (
            <button type="button" onClick={handleNextPage}>
              {loading ? 'Carregando...' : 'Carregar mais posts'}
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 2,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  };

  return {
    props: {
      postsPagination,
    },
    revalidate: 60 * 60 * 24, // 24 hours
  };
};
