package plagiarism

import (
	"math"
	"sort"
	"strings"
	"unicode"
)

// Document — кіріс мәтін + ID (submission_id).
type Document struct {
	ID   uint
	Text string
}

// SimilarityResult — жалпы матрица + жұптар.
type SimilarityResult struct {
	Matrix [][]float64 // NxN, симметрия, диагональ = 1.0
	IDs    []uint      // ретпен ID-лер (matrix индексіне сәйкес)
	Avg    float64     // орташа similarity (диагональсіз)
	Max    float64     // максимум similarity
}

// Compute — N құжатқа TF-IDF cosine similarity матрицасын қайтарады.
// N < 2 болса бос нәтиже.
func Compute(docs []Document) SimilarityResult {
	n := len(docs)
	if n < 2 {
		return SimilarityResult{}
	}

	// 1) Tokenize + stem
	tokenized := make([][]string, n)
	for i, d := range docs {
		tokenized[i] = tokenize(d.Text)
	}

	// 2) TF
	tfs := make([]map[string]float64, n)
	for i, toks := range tokenized {
		tf := make(map[string]float64, len(toks))
		for _, t := range toks {
			tf[t]++
		}
		// log-normalize
		for k, v := range tf {
			tf[k] = 1.0 + math.Log(v)
		}
		tfs[i] = tf
	}

	// 3) DF
	df := map[string]int{}
	for _, tf := range tfs {
		for term := range tf {
			df[term]++
		}
	}

	// 4) IDF
	idf := map[string]float64{}
	for term, cnt := range df {
		idf[term] = math.Log(float64(n)/float64(cnt)) + 1.0
	}

	// 5) TF-IDF vectors + L2 norm
	vecs := make([]map[string]float64, n)
	norms := make([]float64, n)
	for i, tf := range tfs {
		v := make(map[string]float64, len(tf))
		var sumSq float64
		for term, freq := range tf {
			w := freq * idf[term]
			v[term] = w
			sumSq += w * w
		}
		vecs[i] = v
		norms[i] = math.Sqrt(sumSq)
	}

	// 6) Cosine matrix
	matrix := make([][]float64, n)
	for i := range matrix {
		matrix[i] = make([]float64, n)
		matrix[i][i] = 1.0
	}
	var sumOff float64
	var countOff int
	var maxVal float64
	for i := 0; i < n; i++ {
		for j := i + 1; j < n; j++ {
			sim := cosine(vecs[i], vecs[j], norms[i], norms[j])
			matrix[i][j] = sim
			matrix[j][i] = sim
			sumOff += sim
			countOff++
			if sim > maxVal {
				maxVal = sim
			}
		}
	}
	avg := 0.0
	if countOff > 0 {
		avg = sumOff / float64(countOff)
	}

	ids := make([]uint, n)
	for i, d := range docs {
		ids[i] = d.ID
	}
	return SimilarityResult{Matrix: matrix, IDs: ids, Avg: avg, Max: maxVal}
}

// TopPairs — `threshold` асатын ең үлкен `topK` similarity жұптарын қайтарады.
// Әрқайсы: (i, j, sim), мұнда i<j (симметрияны болдырмау үшін).
type Pair struct {
	I          int
	J          int
	Similarity float64
}

func TopPairs(matrix [][]float64, threshold float64, topK int) []Pair {
	n := len(matrix)
	out := []Pair{}
	for i := 0; i < n; i++ {
		for j := i + 1; j < n; j++ {
			if matrix[i][j] >= threshold {
				out = append(out, Pair{I: i, J: j, Similarity: matrix[i][j]})
			}
		}
	}
	sort.Slice(out, func(a, b int) bool {
		return out[a].Similarity > out[b].Similarity
	})
	if topK > 0 && len(out) > topK {
		out = out[:topK]
	}
	return out
}

// ─── tokenization ──────────────────────────────────────────────────────────────

func cosine(a, b map[string]float64, na, nb float64) float64 {
	if na == 0 || nb == 0 {
		return 0
	}
	// Кіші мапа бойынша итерациялаймыз
	small, large := a, b
	if len(b) < len(a) {
		small, large = b, a
	}
	var dot float64
	for term, w := range small {
		if w2, ok := large[term]; ok {
			dot += w * w2
		}
	}
	return dot / (na * nb)
}

// tokenize — lowercase, символдарды бөлеміз, стоп-сөздерді алып тастаймыз,
// 2 әріптен қысқа token-дерді алып тастаймыз, қарапайым суффикс strip жасаймыз.
func tokenize(text string) []string {
	text = strings.ToLower(text)
	fields := strings.FieldsFunc(text, func(r rune) bool {
		return !unicode.IsLetter(r) && !unicode.IsDigit(r)
	})
	out := make([]string, 0, len(fields))
	for _, w := range fields {
		w = strings.TrimSpace(w)
		if len(w) < 3 {
			continue
		}
		if _, ok := stopwords[w]; ok {
			continue
		}
		out = append(out, stem(w))
	}
	return out
}

// stem — өте қарапайым "суффикс strip" (русский + қазақ + ағылшын үшін аздап).
// Идеалдан алыс, бірақ TF-IDF cosine ұқсастығына жеткілікті.
func stem(w string) string {
	suffixes := []string{
		// rus
		"иями", "иями", "ями", "ами", "ого", "ему", "ыми", "ими",
		"ой", "ей", "ие", "ия", "ии", "ый", "ий", "ая", "яя",
		"ом", "ем", "ах", "ях", "ть", "ти", "ло", "ла", "ли", "лы",
		// kaz
		"тардың", "тардан", "лардан", "лардың", "тарға", "ларға",
		"мын", "сын", "тын", "тін", "сіз", "сыз", "пын", "бін",
		// eng
		"ing", "ed", "es", "ly", "er", "est", "ion", "tion",
	}
	for _, s := range suffixes {
		if len(w) > len(s)+2 && strings.HasSuffix(w, s) {
			return w[:len(w)-len(s)]
		}
	}
	return w
}

// stopwords — қарапайым, минималды list (rus + kaz + eng).
var stopwords = map[string]struct{}{
	// rus
	"что": {}, "как": {}, "это": {}, "так": {}, "его": {}, "она": {}, "они": {}, "там": {}, "вот": {}, "при": {},
	"для": {}, "также": {}, "только": {}, "уже": {}, "еще": {}, "если": {}, "потому": {}, "когда": {}, "чтобы": {},
	"быть": {}, "был": {}, "была": {}, "были": {}, "есть": {}, "ему": {}, "все": {},
	// kaz
	"мен": {}, "сен": {}, "сіз": {}, "ол": {}, "біз": {}, "сендер": {}, "сіздер": {}, "олар": {},
	"және": {}, "немесе": {}, "бірақ": {}, "себебі": {}, "сондықтан": {}, "болады": {}, "болуы": {}, "тағы": {},
	"үшін": {}, "арқылы": {}, "туралы": {}, "ішінде": {}, "одан": {}, "оның": {}, "осы": {}, "сол": {}, "бұл": {},
	// eng
	"the": {}, "and": {}, "for": {}, "are": {}, "but": {}, "not": {}, "you": {}, "all": {}, "can": {}, "had": {},
	"her": {}, "was": {}, "one": {}, "our": {}, "out": {}, "day": {}, "get": {}, "has": {}, "him": {}, "his": {},
	"how": {}, "man": {}, "new": {}, "now": {}, "old": {}, "see": {}, "two": {}, "way": {}, "who": {}, "boy": {},
	"did": {}, "its": {}, "let": {}, "put": {}, "say": {}, "she": {}, "too": {}, "use": {},
}
