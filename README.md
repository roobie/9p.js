
## Setting up

Install deps

```shell
npm i -g yarn
yarn
```

## building

The code in `lib` should work on ES2015 (with modules) compliant platforms
For older platforms use the commonjs modules found in `lib.es5`

To build the es5 modules, run:

```shell
npm run build
```

and use the modules in the directory `lib.es5`


## developing

Run:

```shell
npm run test:cont
```

Which will continuously run `npm test` on file changes


## Ideas and TODOs


### Server

* How about a "github" FS implementation? Manage a repo via 9p, like.
* in memory FS which has persist/load from physical FS


### Clients

* CLI:

  `$ ix --set-current --username=bjorn --host=http://localhost:8080 # or tcp://localhost:7654`

  `$ ix mkdir /test`

  `$ ix cd /test`

  `$ ix mkfile test.txt`

  `$ ix ls`

  `$ ix read test.txt > contents.txt`
