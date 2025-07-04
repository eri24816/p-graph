import ast

def exec_(script,globals=None, locals=None,print_=None):
    stmts = list(ast.iter_child_nodes(ast.parse(script)))
    if stmts == []:
        return
    if isinstance(stmts[-1], ast.Expr):
        if len(stmts) > 1:
            ast_module = ast.parse("")
            ast_module.body=stmts[:-1]
            exec(compile(ast_module, filename="<ast>", mode="exec"), globals, locals)
        last = eval(compile(ast.Expression(body=stmts[-1].value), filename="<ast>", mode="eval"), globals, locals)
        if last is not None and print_ is not None:
            print_(last)
        return last
    else:    
        exec(script, globals, locals)