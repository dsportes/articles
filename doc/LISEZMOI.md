git init 
git config credential.helper store

// Mettre les sources changés en stages
git commit -m "init"

git remote add origin https://github.com/dsportes/articles.git
git push -u origin master
