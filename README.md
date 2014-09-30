TNG isucon4_qualify
===============

### 提出Score 29500くらい

* 予選時に使った最終成果リポジトリ
* その後一人反省会をしていく。

##### 09/29 00:00 更新
* MySQLのストレージエンジンをMEMORYに変更することで *Score 30000* まで上昇。
* UsersテーブルのSELECT結果セットをメモリに保持することで *Score 30500* まで上昇。

##### 09/30 00:00 更新
* クエリストリングを用いてトップページを静的出力で *Score 37500* まで上昇。

##### 09/30 01:00 更新
* mypage.ectとlayout.ectを単一のテンプレート `comp_mypage.ect` にして *Score 38000* まで上昇。

##### 09/30 01:20 更新
* nginx.confをパフォーマンス重視の設定に変更して *Score 38500* まで上昇。

##### 09/30 12:00 更新
* CSSファイルを読み込まない（点数の高いHTMLを多く捌かせる）変更をして *Score 56200* まで上昇。
* 見た目のレギュレーションを守るために、scriptタグでCSSファイルをloadさせている。

##### 09/30 18:00 更新
* crypto通さずにパスワードを直読み比較。
* Usersテーブルのレコードを事前に全てRedisに載せ替え、そこからReadすることで *Score 62000* まで上昇。
