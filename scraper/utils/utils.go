package utils

import (
	"bytes"
	"io"
	"regexp"
	"strings"

	"github.com/PuerkitoBio/goquery"
	"golang.org/x/text/encoding/simplifiedchinese"
	"golang.org/x/text/transform"
)

func GetTextWithLineBreaks(selection *goquery.Selection) string {
	reLineBreak := regexp.MustCompile(`(?i)<br\s*/?>|<\s*/p\s*>|<\s*/div\s*>`)
	html, _ := selection.Html()
	formatted := reLineBreak.ReplaceAllString(html, "\n")
	doc, _ := goquery.NewDocumentFromReader(strings.NewReader(formatted))
	return strings.TrimSpace(doc.Text())
}

func GBKToUTF8(s []byte) (string, error) {
	reader := transform.NewReader(bytes.NewReader(s), simplifiedchinese.GBK.NewDecoder())
	d, err := io.ReadAll(reader)
	if err != nil {
		return "", err
	}
	return string(d), nil
}
