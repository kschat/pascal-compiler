PROGRAM hello (output);

{Write 'Hello, world.' ten times.}
VAR
    i:integer;

BEGIN {hello}
    FOR i := 1 TO 10 DO BEGIN
        writeln('
        Hello, world
        ');
    END;

    IF i THEN
      writeln(i);
    END;

END {hello}.

1
3.14
2e7
5E6
7e+8
8e-9
5.94e56
3.68E+823
2..3