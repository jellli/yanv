package models

type Novel struct {
	ID          string  `json:"id"`
	No          string  `json:"no"`
	Title       string  `json:"title"`
	Author      string  `json:"author"`
	Category    string  `json:"category"`
	StarRating  float64 `json:"star_rating"`
	Summary     string  `json:"summary"`
	ShortIntro  string  `json:"short_intro"`
	Conception  string  `json:"conception"`
	Tags        string  `json:"tags"`
	Keywords    string  `json:"keywords"`
	UpdateTime  string  `json:"update_time"`
	Size        string  `json:"size"`
	SourceURL   string  `json:"source_url"`
	DownloadURL string  `json:"download_url"`
	LocalPath   string  `json:"local_path"`
}
