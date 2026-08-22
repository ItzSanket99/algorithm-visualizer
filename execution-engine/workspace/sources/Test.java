public class Test {

    public static void main(String[] args) {

        int result = factorial(3);

        System.out.println(result);
    }

    static int factorial(int n) {

        if (n == 0) {
            return 1;
        }

        int result =
                n * factorial(n - 1);

        return result;
    }
}
