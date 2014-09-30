filetype off                   " Required!

set nocompatible               " Be iMproved

set encoding=utf-8
set fileencodings=iso-2022-jp,euc-jp,sjis,utf-8


colorscheme desert
syntax on

" rWA[hőIⵂ½eLXgªANbv{[hɓü¤ɂ·é http://nanasi.jp/articles/howto/editing/clipboard.html
set clipboard=autoselect

" ³¼WX^ɓü[^ðWX^ɂàêB
set clipboard+=unnamed
" set clipboard=unnamedplus " this works only on Ubuntu

" sԍ\¦
set number
" ����ʂ̃nCCg
set hlsearch
" ����ʂ𒀎nCCg
set incsearch
" Xe[^XC̕\¦𒲐®
set statusline=%<%F\ %m%r%h%w%{'['.(&fenc!=''?&fenc:&enc).']['.&ff.']'}%=%l,%c%V%8P


 " S[hŃ}EXðøset mouse=a


 " Better command-line completion
 " R}hC⊮ðÉ set wildmenu wildmode=list:full

 " ©®⊮|bvAbvðɕ\¦
 set completeopt=menuone
 for k in split("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_",'\zs')
   exec "imap " . k . " " . k . "<C-N><C-P>"
 endfor

 imap <expr> <TAB> pumvisible() ? "\<Down>" : "\<Tab>"


" Page Down, Page UpŔ¼æXN[
noremap <C-U> <PageUp>
noremap <C-D> <PageDown>


 " ^Cvr̃R}hðʍŉºsɕ\¦
 set showcmd

 " æŉºsɃ[[ð¦·éset ruler

 " ����ɑ啶E¬¶ðʂµȂ¢B½¾µAõɑ啶¬¶ª
 " ¬݂µĂ¢é«͋æ·éset ignorecase
 set smartcase
 
 " I[gCfgAüCT[g[hJn¼ãobNXy[XL[Å " 폜ł«é¤ɂ·é
 set backspace=indent,eol,start
 
 " I[gCfg
 "set autoindent

nmap <Esc><Esc> :nohlsearch<CR><Esc>
set cursorline     " J[\s̔wiFð¦éet t_Co=256
hi CursorLine   term=reverse cterm=none ctermbg=235
hi StatusLine   ctermfg=yellow ctermbg=17 cterm=none
hi LineNr       ctermfg=gray cterm=none
set laststatus=2   " Xe[^Xsðɕ\¦
set cmdheight=2    " bZ[W\¦ðmÛset showmatch      " Ή·銇ʂ뭒²\¦


" ********** TAB Setting Start **********
" Anywhere SID.
function! s:SID_PREFIX()
  return matchstr(expand('<sfile>'), '<SNR>\d\+_\zeSID_PREFIX$')
endfunction

" Set tabline.
function! s:my_tabline()  "{{{
  let s = ''
  for i in range(1, tabpagenr('$'))
    let bufnrs = tabpagebuflist(i)
    let bufnr = bufnrs[tabpagewinnr(i) - 1]  " first window, first appears
    let no = i  " display 0-origin tabpagenr.
    let mod = getbufvar(bufnr, '&modified') ? '!' : ' '
    let title = fnamemodify(bufname(bufnr), ':t')
    let title = '[' . title . ']'
    let s .= '%'.i.'T'
    let s .= '%#' . (i == tabpagenr() ? 'TabLineSel' : 'TabLine') . '#'
    let s .= no . ':' . title
    let s .= mod
    let s .= '%#TabLineFill# '
  endfor
  let s .= '%#TabLineFill#%T%=%#TabLine#'
  return s
endfunction "}}}
let &tabline = '%!'. s:SID_PREFIX() . 'my_tabline()'
set showtabline=2 " í^uCð¦

" The prefix key.
nnoremap    [Tag]   <Nop>
nmap    t [Tag]
" Tab jump
for n in range(1, 9)
  execute 'nnoremap <silent> [Tag]'.n  ':<C-u>tabnext'.n.'<CR>'
endfor
" t1 Åԍ¶̃^uAt2 Åԍ¶©çԖڂ̃^uɃWv

map <silent> <F5> :tablast <bar> tabnew<CR>
" tc Vµ¢^uðԉEɍì
map <silent> <F6> :tabclose<CR>
" tx ^uð¶éap <silent> <f4> :tabnext<CR>
" tn ̃^u
map <silent> <f3> :tabprevious<CR>
" tp O̃^u
" ********** TAB Setting End **********


"--------------------------------------------------------------------------
" neobundle

"if has('vim_starting')
"  set runtimepath+=~/.vim/bundle/neobundle.vim/
"  call neobundle#rc(expand('~/.vim/bundle/'))
"endif

"netrw.vimƋ£
"NeoBundle 'scrooloose/nerdtree'




"netrw.vim
"---------------------
 "netrw͏ítree view
 let g:netrw_liststyle = 3
 " CVSÆŎn܂é@C͕\¦µȂ¢
 "let g:netrw_list_hide = 'CVS,\(^\|\s\s\)\zs\.\S\+'
 " 'v'Ńt@Cð­Ƃ«͉E¤ɊJ­B(ftHgª¶¤Ȃ̂œü¦)
 let g:netrw_altv = 1
 " 'o'Ńt@Cð­Ƃ«͉º¤ɊJ­B(ftHgª㑤Ȃ̂œü¦)
 let g:netrw_alto = 1
 " F2L[Ńc[\¦
 nnoremap <f2> :Explore<CR>


" t@C¼Ɠàɂæăt@C^Cv𔻕ʂµAt@C^CvvOCðøéiletype plugin indent on     " Required!
