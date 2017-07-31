#!/bin/bash

for f in ./*.js;
do 
	js-beautify -j -f $f -o $f;
	jslint $f; 
done

