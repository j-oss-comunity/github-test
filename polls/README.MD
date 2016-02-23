①環境作成方法

(1)Node.jsインストール

(2)MongoDB
docker run -d -p --name polls-mongodb mongo
docker run -d -p 27017:27017 -p 28017:28017 --name polls-mongodb mongo mongod --rest --httpinterface



②mongoDBのパス設定
docker run -d --name polls-mongodb mongo



③環境設定

(1)IPの確認
docker-machine ip default
192.168.99.100
	※ほとんどの場合、同じIPになる


(2)mongodb接続設定
routes/index.js

[変更前]
   db = mongoose.createConnection('localhost', 'pollsapp');
[変更後]
   db = mongoose.createConnection('192.168.99.100', 'pollsapp');



④node.jsアプリ起動
cd C:\work\Google ドライブ\tech\source\nodejs\polls
node app



⑤ブラウザー接続
http://localhost:3000/


⑥mongoDBの中を見るには
docker exec -it polls-mongodb bash
