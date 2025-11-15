import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../db';
import type { PhraseSet } from '../constants/phrases';
import './PhraseImportTool.css';

const CMUDICT_URL =
  'https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict';

const SIGHT_WORDS = new Set([
  'a','and','away','big','blue','can','come','down','find','for','funny','go',
  'help','here','i','in','is','it','jump','little','look','make','me','my','not',
  'one','play','red','run','said','see','the','three','to','two','up','we','where',
  'yellow','you','all','am','are','at','ate','be','black','brown','but','came',
  'did','do','eat','four','get','good','has','have','he','into','like','must','new',
  'no','now','on','our','out','please','pretty','ran','ride','saw','say','she','so',
  'soon','that','there','they','this','too','under','want','was','well','went','what',
  'white','who','will','with','yes','after','again','an','any','as','ask','by','could',
  'every','fly','from','give','going','had','her','him','his','how','just','know','let',
  'live','may','of','old','once','open','over','put','round','some','stop','take',
  'thank','them','then','think','walk','were','when','always','around','because','been',
  'before','best','both','buy','call','cold','does',"don't",'fast','first','five','found',
  'gave','goes','green','its','made','many','off','or','pull','read','right','sing','sit',
  'sleep','tell','their','these','those','upon','us','very','wash','which','why','wish',
  'work','would','write','your','about','better','bring','carry','clean','cut','done',
  'draw','drink','eight','fall','far','full','got','grow','hold','hot','hurt','if','keep',
  'kind','laugh','light','long','much','myself','never','only','own','pick','seven',
  'shall','show','six','small','start','ten','today','together','try','warm','air','also',
  'another','back','below','between','boy','change','different','each','end','even',
  'follow','form','great','hand','help','home','house','just','large','learn','letter',
  'line','little','man','men','most','mother','move','name','need','page','picture',
  'place','plant','point','right','same','school','should','small','sound','spell','still',
  'study','such','turn','use','way','well','world','write'
]);

const ARPABET_TO_OG: Record<string, string> = {
  AA: 'ă', AE: 'ă', AH: 'ŭ', AO: 'ŏ', AW: 'ow', AY: 'ī',
  EH: 'ĕ', ER: 'er', EY: 'ā', IH: 'ĭ', IY: 'ē', OW: 'ō',
  OY: 'oi', UH: 'ŏŏ', UW: 'oo', B: 'b', CH: 'ch', D: 'd',
  DH: 'th', F: 'f', G: 'g', HH: 'h', JH: 'j', K: 'k',
  L: 'l', M: 'm', N: 'n', NG: 'ng', P: 'p', R: 'r',
  S: 's', SH: 'sh', T: 't', TH: 'th', V: 'v', W: 'w',
  Y: 'y', Z: 'z', ZH: 'zh',
};

interface PhraseData {
  set_id: string;
  text: string;
  sightWords: string[];
  phoneticPatterns: string[];
  issues?: string[];
}

const normalizeWord = (word: string) =>
  word.normalize('NFC').toLowerCase().replace(/[^a-z']/g, '');

const PhraseImportTool: React.FC = () => {
  const [phrases, setPhrases] = useState<PhraseData[]>([]);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [cmudictLoaded, setCmudictLoaded] = useState(false);
  const [cmudict, setCmudict] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(CMUDICT_URL)
      .then(res => res.text())
      .then(text => {
        const dict: Record<string, string> = {};
        for (const line of text.split('\n')) {
          if (line.startsWith(';;;')) continue;
          const match = line.match(/^(\S+)\s+(.+)$/);
          if (match) dict[match[1].toLowerCase()] = match[2];
        }
        setCmudict(dict);
        setCmudictLoaded(true);
      })
      .catch(err => {
        console.error('Failed to load CMUdict', err);
        setError('Failed to load pronunciation dictionary.');
        setCmudictLoaded(true);
      });
  }, []);

  const arpaToOG = (arpaPhonemes: string) =>
    arpaPhonemes
      .split(' ')
      .map(p => ARPABET_TO_OG[p.replace(/[012]/g, '')] || `[UNK:${p}]`)
      .join('-');

  const getPhoneticPattern = (word: string) => {
    const normalized = normalizeWord(word);
    const arpa = cmudict[normalized];
    if (!arpa) return { pattern: normalized.split('').join('-'), oov: true };
    return { pattern: arpaToOG(arpa), oov: false };
  };

  const processPhrase = (setId: string, text: string): PhraseData => {
    const words = text.split(/\s+/);
    const sightWords = words.map(normalizeWord).filter(w => SIGHT_WORDS.has(w));
    const issues: string[] = [];
    const phoneticPatterns = words.map(word => {
      const { pattern, oov } = getPhoneticPattern(word);
      if (oov || pattern.includes('[UNK')) issues.push(word);
      return pattern;
    });
    return {
      set_id: setId,
      text,
      sightWords,
      phoneticPatterns,
      issues: issues.length ? Array.from(new Set(issues)) : undefined,
    };
  };

  const handleFileImport = (file: File) => {
    if (!cmudictLoaded) {
      setError('Please wait for pronunciation dictionary to load…');
      return;
    }

    setProcessing(true);
    setError('');
    setPhrases([]);

    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet) as {
          set_id?: string;
          phrase_text?: string;
        }[];

        const valid = rows.filter(r => r.set_id && r.phrase_text);
        const processed = valid.map(r => processPhrase(r.set_id!, r.phrase_text!));
        setPhrases(processed);

        const grouped = processed.reduce<Record<string, PhraseData[]>>((acc, p) => {
          acc[p.set_id] ||= [];
          acc[p.set_id].push(p);
          return acc;
        }, {});

        for (const [setId, items] of Object.entries(grouped)) {
          const phraseSet: PhraseSet = {
            id: `${setId}-imported`,
            focus: `${setId} - Imported Phrases`,
            phrases: items.map((p, i) => ({
              id: `${setId.replace(/[^a-z0-9]/gi, '')}${String(i + 1).padStart(
                2,
                '0'
              )}`,
              text: p.text,
              sightWords: p.sightWords,
              phoneticPatterns: p.phoneticPatterns,
            })),
          };

          const exists = await db.phraseSets.get(phraseSet.id);
          if (!exists) await db.phraseSets.add(phraseSet);
        }
      } catch (err: any) {
        setError(`Error processing file: ${err.message}`);
      } finally {
        setProcessing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    const template = `set_id,phrase_text
Grade4,We can learn new things every day
Grade4,Reading helps our minds grow strong
Grade5,Curiosity leads to great discoveries`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'phrase_import_template.csv';
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="phrase-import-tool">
      <h1>📚 Phrase Import Tool</h1>
      <p>
        Upload Excel/CSV with <code>set_id</code> and <code>phrase_text</code>
      </p>

      {/* FILE BUTTONS */}
      <div className="file-controls">
        <label htmlFor="file-upload" className="btn btn-upload">
          📁 Choose File
        </label>

        <button onClick={downloadTemplate} type="button" className="btn btn-template">
          🧩 Download Template
        </button>
      </div>

      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
        id="file-upload"
        onChange={e => e.target.files?.[0] && handleFileImport(e.target.files[0])}
        disabled={!cmudictLoaded || processing}
      />

      {/* EXPLANATION SECTION */}
      <div className="import-explanation">
        <h3>How This Works</h3>

        <p>
          You can upload a list of phrases to quickly add new reading material for
          students. The file should follow the structure shown in the template. Each
          row represents a single phrase entry, including its phrase text, the
          category or skill it belongs to, and an optional difficulty level.
        </p>

        <p>
          If you’re not sure how to format your file, click{' '}
          <strong>“Download Template”</strong> to get a ready-made example. Then fill
          in your phrases, save the file, and click <strong>“Choose File”</strong> to
          upload it.
        </p>

        <p>
          After uploading, the tool will process your file, check for any issues, and
          show you exactly which phrases were imported successfully.
        </p>
      </div>

      {processing && <p>⏳ Processing…</p>}
      {error && <div className="error-box">❌ {error}</div>}

      {phrases.length > 0 && (
        <div>
          <h2>✅ Imported Phrases ({phrases.length})</h2>

          {phrases.map((p, i) => (
            <div key={i} className="phrase-card">
              <strong>{p.set_id}</strong>: {p.text}
              <div>Sight Words: {p.sightWords.join(', ') || 'none'}</div>
              {p.issues && <div>Issues: {p.issues.join(', ')}</div>}
              <div>Phonetic: {p.phoneticPatterns.join(' | ')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhraseImportTool;
