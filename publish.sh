#!/bin/bash

set -e
rollup -c
npm version patch
npm publish --registry=https://registry.npmjs.org/

git push origin --tags
