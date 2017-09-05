\documentclass{article}

\def\textmu{}

\IfStrEq*{\jobname}{none}%
  {\newenvironment{code}{\verbatim}{\endverbatim}}%

%include agda.fmt

\begin{document}

The identity function:

\begin{code}
id : {S : Set} -> S -> S
id {S} x = x
\end{code}

\end{document}
