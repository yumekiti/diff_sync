import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { Grid } from '@nextui-org/react';
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

import Editor from '@monaco-editor/react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Explain from '../components/Explain';
import Diff from '../components/Diff';
import Language from '../components/Language';
import Share from '../components/Share';
let socket: any;

const Home: NextPage = () => {
  const router = useRouter();
  const { token } = router.query;
  const [values, setValues] = useState({
    lang: 'javascript',
    rcode: '',
    lcode: '',
    token: token,
  });
  const [timerId, setTimerId] = useState<any>(null);
  const [update, setUpdate] = useState<boolean>(true);

  const debounce = (fn: Function, bufferInterval = 2000) => {
    return () => {
      clearTimeout(timerId);
      let timer = setTimeout(() => {
        fn();
      }, bufferInterval);
      setTimerId(timer);
    };
  };

  const editorLock = async (set: void) => {
    await setUpdate(false);
    await set;
    await setUpdate(true);
  }

  useEffect(() => {
    fetch('/api/socket');
    socket = io();

    socket.on('connect', () => {
      console.log('connected');
    });

    socket.on('update', (value: any) => {
      if (value.token == token) {
        editorLock(setValues(value))
      }
    });
  }, []);

  return (
    <>
      <Header />
      <Grid.Container gap={3}>
        <Grid xs={12}>
          <Language
            lang={values.lang}
            onChange={(value: string) => {
              setValues({ ...values, lang: value });
              socket.emit('change', { ...values, lang: value });
            }}
          />
        </Grid>
        <Grid xs={12} sm={6}>
          <Editor
            theme='vs-dark'
            height='50vh'
            language={values.lang}
            value={values.lcode}
            onChange={(value: any) => {
              setValues({ ...values, lcode: value });
              if (update) {
                debounce(() => {
                  socket.emit('change', { ...values, lcode: value });
                  console.log('event');
                })();
              }
            }}
          />
        </Grid>
        <Grid xs={12} sm={6}>
          <Editor
            theme='vs-dark'
            height='50vh'
            language={values.lang}
            value={values.rcode}
            onChange={(value: any) => {
              setValues({ ...values, rcode: value });
              if (update) {
                debounce(() => {
                  socket.emit('change', { ...values, rcode: value });
                })();
              }
            }}
          />
        </Grid>
        <Grid xs={12}>
          <Diff lang={values.lang} rcode={values.rcode} lcode={values.lcode} />
        </Grid>
        <Grid xs={12} sm={6}>
          <Explain />
        </Grid>
        <Grid xs={12} sm={6}>
          <Share
            url={'https://diff-sync-code.up.railway.app/' + token}
            text={'コード比較しませんか？'}
          />
        </Grid>
      </Grid.Container>
      <Footer />
    </>
  );
};

export default Home;
