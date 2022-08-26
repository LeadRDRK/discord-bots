CC= gcc -std=gnu99
CFLAGS= -O2 -Wall -Wextra -Llua/src -llua -lm -ldl -s -Ilua/src

MKDIR= mkdir -p
RM= rm -f

all: lua dist/ballslua dist/ballslua_eval
ballslua: dist/ballslua
ballslua_eval: dist/ballslua_eval

lua:
	$(MAKE) -C lua

dist/ballslua: src/ballslua.c
	$(MKDIR) dist
	$(CC) src/ballslua.c $(CFLAGS) -o dist/ballslua

dist/ballslua_eval: src/ballslua_eval.c
	$(MKDIR) dist
	$(CC) src/ballslua_eval.c $(CFLAGS) -o dist/ballslua_eval

clean:
	$(RM) -r dist
	$(MAKE) -C lua clean

.PHONY: all lua
