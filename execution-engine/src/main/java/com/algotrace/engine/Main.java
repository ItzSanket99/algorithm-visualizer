package com.algotrace.engine;

import com.algotrace.engine.compiler.CompilationResult;
import com.algotrace.engine.compiler.JavaSourceCompiler;
import com.algotrace.engine.debug.DebugLauncher;
import com.algotrace.engine.debug.DebugSession;
import com.algotrace.engine.debug.MethodEventCollector;

public class Main {

    public static void main(String[] args) throws Exception {

        String source = """
            public class Test {
            
                public static void main(String[] args) {
            
                    factorial(3);
            
                }
            
                static int factorial(int n){
            
                    if(n==0)
                        return 1;
            
                    return n*factorial(n-1);
            
                }
            
            }
            """;

        JavaSourceCompiler compiler =
                new JavaSourceCompiler();

        CompilationResult result =
                compiler.compile(source);

        if (!result.isSuccess()) {

            System.out.println(result);

            return;

        }

        DebugLauncher launcher = new DebugLauncher();

        try (DebugSession session =
                     launcher.launch(result.getClassName())) {

            MethodEventCollector collector =
                    new MethodEventCollector(session);

            collector.start();

        }

    }

}