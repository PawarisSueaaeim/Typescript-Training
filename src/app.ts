// drag & drop interfaces
interface Draggable { // การกำหนด type event
    onDragStart(e: DragEvent): void;
    onDragEnd(e: DragEvent): void;
}
interface DragTarget {
    onDragOver(e: DragEvent): void;
    onDrop(e: DragEvent): void;
    onDragLeave(e: DragEvent): void;
}

// Project type more classes & custom type
enum ProjectStatus { Active , Finished } // สามารถกำหนดได้ว่า type จะชื่ออะไรโดยใช้ enum

class Project { // สร้าง class project ที่สามารถเก็บ type ของตัวแปรได้หลาย type แล้วเอาไปใช้แทน any
    constructor(
        public id: string, 
        public title: string, 
        public description: string, 
        public people: number, 
        public status: ProjectStatus
        ) {}
}

// Class projects state management
type Listener<T> = (Items: T[]) => void; // สร้าง type ครอบ class ที่สามารถเก็บได้หลาย type อีกทีนึงได้

class State<T> {
    protected listeners: Listener<T>[] = []; // การประกาศตัวแปรแบบ protected หมายถึงจะไม่สามารถเข้าถึงได้จาก class อื่นแต่สามารถเข้าถึงได้จากการสืบทอด (inheritance)

    addListener(listenerFn: Listener<T>) {
        this.listeners.push(listenerFn);
    }
}

class ProjectState extends State<Project>{ // สร้าง class และสร้าง type ว่า project
    
    private projects: Project[] = []; // เราจะสามารถนำ type project มาใช้ได้
    private static instance = new ProjectState();

    private constructor() {
        super();
    };

    static getInstance() {
        if (this.instance){
            return this.instance;
        }
        this.instance = new ProjectState();
        return this.instance;
    }

    addProject(title: string, description: string, numberOfPeople: number) {
        const newProjects = new Project(
            Math.random().toString(),
            title,
            description,
            numberOfPeople,
            ProjectStatus.Active
        );
        this.projects.push(newProjects);
        this.updateListeners();
    }

    moveProject (projectId: string, newStatus: ProjectStatus) { // เอาไว้ในการย้ายโปรเจคว่าจะย้ายด้วย id อะไรและย้ายไปที่ไหน(status) โดยใช้ cumtom type ที่เราสร้าง
        const project = this.projects.find(p => p.id === projectId);
        if (project && project.status !== newStatus){ // การย้ายโปรเจค status current มันต้องไม่เหมือนกับ newStatus
            project.status = newStatus;
            this.updateListeners();
        }
    }

    updateListeners() { //เอาไว้ update เมื่อ list มีการเปลี่ยน status
        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice());
        }
    }
}

const projectState = ProjectState.getInstance();

interface Validateable { // **** เราสามารถใช้ interface ทำการกำหนดว่า input ของ Validateable ต้องเป็นอะไรบ้าง ถ้าเราใช้ตัวแปรนี้แล้วเผลอใส่ input ผิดจะ error ทันที
    value: string | number ,
    required?: boolean,
    minLength?: number,
    maxLength?: number,
    min?: number,
    max?: number,
}

function validate( validateableInput: Validateable) { // สร้าง function เพื่อตรวจสอบ input
    let isValid = true; // set ตัวแปร isValid เป็น true
    if (validateableInput.required) { // รับ req มา เลือกเป็นตัว required 
        isValid = isValid && validateableInput.value.toString().trim().length !== 0; //  เอามาเช็คว่าตัวแปรที่เข้ามามีค่าไม่เท่ากับ 0 
    }
    if ( validateableInput.minLength != null && typeof validateableInput.value === 'string' ){ // ถ้าความยาวไม่เท่ากับ null และค่าของ input เป็น string
        isValid = isValid && validateableInput.value.length >= validateableInput.minLength;
    }
    if (validateableInput.maxLength != null && typeof validateableInput.value === 'string' ){
        isValid = isValid && validateableInput.value.length <= validateableInput.maxLength;
    }
    if (validateableInput.min != null && typeof validateableInput.value === 'number'){
        isValid = isValid && validateableInput.value >= validateableInput.min;
    }
    if (validateableInput.max != null && typeof validateableInput.value === 'number'){
        isValid = isValid && validateableInput.value <= validateableInput.max;
    }
    return isValid;
}

function autobind(_: any ,_2: string, descriptor: PropertyDescriptor) { // _ หมายความว่าเรายังไม่ได้ใช้ paramiter นั้นตอนนี้ เลยใส่ไว้กัน error
    const originalMethod = descriptor.value;
    const adjDescriptor:PropertyDescriptor = {
        get() {
            const boundFn = originalMethod.bind(this);
            return boundFn
        }
    }
    return adjDescriptor;
};

// Component base class adding inheritance and generic
abstract class Component <T extends HTMLElement, U extends HTMLElement >{ // สามารถประกาศ type แบบนี้ได้ (inheritance)
    templateElement: HTMLTemplateElement;
    hostElement: T;
    element: U;

    constructor( // เอาไว้เรียกใช้ที่อื่นๆได้ผ่านตัว super()
        templateId: string,
        hostElementId: string,
        insertAtStart: boolean,
        newElementId: string,
    ){
        this.templateElement = document.getElementById(templateId)! as HTMLTemplateElement;
        this.hostElement = document.getElementById(hostElementId)! as T;

        const importedNode = document.importNode(this.templateElement.content, true);

        this.element = importedNode.firstElementChild as U;
        if(newElementId) {
            this.element.id = newElementId;
        }

        this.attach(insertAtStart);
    }

    private attach(insertBegining: boolean) {
        this.hostElement.insertAdjacentElement(insertBegining ? 'afterbegin' : 'beforeend', this.element)
    }

    abstract configure(): void
    abstract renderContent(): void
}
// Project Item component class เอาไว้เรียกใช้ตอนจะสร้าง Ul list
class ProjectItem extends Component<HTMLUListElement,HTMLLIElement> implements Draggable{
    private project: Project;
      
    get persons () { //เอาไว้เช็คว่า people input มีเท่าไหร่
        if(this.project.people.toString() == '1'){
            return '1 person';
        }else{
            return this.project.people.toString() + ' persons';
        }
    }
    constructor(hostId: string, project: Project) {
      super('single-project', hostId, false, project.id);
      this.project = project;
      
      this.configure();
      this.renderContent();
    }

    @autobind
    onDragStart(e: DragEvent) {
        e.dataTransfer!.setData('text/plain', this.project.id);
        e.dataTransfer!.effectAllowed = 'move';
    }

    onDragEnd(_: DragEvent) { // ใส่ _ หมายความว่าเราไม่ได้ใช้ paramiter นี้
        console.log('DragEnd');
    }
      
    configure() {
        this.element.addEventListener('dragstart', this.onDragStart);
        this.element.addEventListener('dragend', this.onDragEnd);
    }
      
    renderContent() {
      this.element.querySelector('h2')!.textContent = this.project.title;
      this.element.querySelector('h3')!.textContent = this.persons + ' assigned';
      this.element.querySelector('p')!.textContent = this.project.description;
    }

}
// ProjectList Class
class ProjectList extends Component<HTMLDivElement, HTMLElement> implements DragTarget{ // สร้างตัวแปรและ ประกาศ type โดยใช้ component
    assignedProjects: Project[];

    constructor(private type: 'active' | 'finished'){ // เราจะสามารถส่งค่าผ่าน supper() ได้เลย
        super('project-list', 'app', false ,`${type}-projects`); // ซึ่งปกติจะส่งโดยใช้ getElementById แล้วก็ต้องมี as HTMLTemplateElement ยาวๆ
        this.assignedProjects = [];

        this.configure();
        this.renderContent(); // call renderContent
    }

    @autobind
    onDragOver(e: DragEvent) { 
        if (e.dataTransfer && e.dataTransfer.types[0] === 'text/plain') {
            e.preventDefault();
            const listEl = this.element.querySelector('ul')!;
            listEl.classList.add('droppable');
        }
    }

    @autobind
    onDragLeave(_: DragEvent) {
        const listEl = this.element.querySelector('ul')!;
        listEl.classList.remove('droppable');
    }

    @autobind
    onDrop(e: DragEvent) {
        const projectId = e.dataTransfer!.getData('text/plain'); // สร้างตัวแปรเพื่อรับ id ที่ต้องการย้าย
        projectState.moveProject(projectId, this.type == 'active' ? ProjectStatus.Active : ProjectStatus.Finished); // call function move project ส่ง id และ status ไป
    }

    configure() { projectState.addListener((project: Project[]) => {
        this.element.addEventListener('dragover', this.onDragOver);
        this.element.addEventListener('dragleave', this.onDragLeave);
        this.element.addEventListener('drop', this.onDrop);

        const releventProject = project.filter(prj => { // สร้างตัวที่เอาไว้ return ว่าตัวที่ add เข้ามาอยู่ status ไหน
            if( this.type == 'active' ) {
                return prj.status === ProjectStatus.Active; // วิธีการใช้ type enum
            }else{
                return prj.status === ProjectStatus.Finished; // วิธีการใช้ type enum
            }
        });
        this.assignedProjects = releventProject; // แล้วเอามายัดเข้าตัวแปรที่จะเอาไปแสดง
        this.renderProjects(); // และ call renderProjects
    })}

    renderContent () {
        const listId =  `${this.type}-project-list`;
        this.element.querySelector('ul')!.id = listId;
        this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + 'PROJECTS';
    }

    private renderProjects () {  // function เอาไว้รันสร้าง list project ที่กด add เข้ามา
        const listEl =  document.getElementById(`${this.type}-project-list`)! as HTMLUListElement; // สร้างตัวแปรเพื่อเก็บก่อนว่าจะเอาไปสร้างที่ active หรือ finished
        listEl.innerHTML = '';
        for (const prjItem of this.assignedProjects) {
            new ProjectItem(this.element.querySelector('ul')!.id, prjItem);
        }
    }
}

// ProjectInput class
class ProjectInput extends Component<HTMLDivElement,HTMLFormElement>{ // ประกาศตัวแปร และ type ของตัวแปรโดยใช้ components
    titleInputElement: HTMLInputElement;
    descriptionInputElement: HTMLInputElement;
    peopleInputElement: HTMLInputElement;

    constructor() {
        super('project-input','app', true, 'user-input'); // ใช้ super เพื่อลดการเขียนเยอะปกติต้องจับเท่ากับ โดยใช้ getElementById

        this.titleInputElement = this.element.querySelector('#title') as HTMLInputElement;
        this.descriptionInputElement = this.element.querySelector('#description') as HTMLInputElement;
        this.peopleInputElement = this.element.querySelector('#people') as HTMLInputElement;

        this.configure();
    }
    
    configure () {
        this.element.addEventListener('submit', this.submitHandler.bind(this));    
    }

    renderContent(): void {
        
    }

    // ส่วนของการ Input ข้อมูล 
    private getherUserInput (): [string, string, number] | undefined { // ประกาศ function ชื่อว่า getherUserInput รับค่า 3 ชนิด
        const enteredTitle = this.titleInputElement.value;  // สร้างตัวแปรเพื่อรับค่าของ input ของ titleInputElement
        const enteredDescription = this.descriptionInputElement.value; // สร้างตัวแปรเพื่อรับค่า input ของ descriptionInputElement
        const enteredPeople = this.peopleInputElement.value; // สร้างตัวแปรเพื่อรับค่า input ของ peopleInputElement

        const titleValidate: Validateable = { // สร้างตัวแปร titleValidate เพื่อเก็บค่า value, required, minLength เพื่อเอาไปตรวจสอบ
            value: enteredTitle,  // จับตัวแปร enteredTitle ยัดลงไป
            required: true,
            minLength: 1, // เพื่อเอาไว้กำหนดว่าจะต้องมีความยาวต่ำสุดเท่าไหร่
        }
        const descriptionValidate: Validateable = { // สร้างตัวแปร descriptionValidate เพื่อเก็บค่า ต่อไปนี้
            value: enteredDescription, // จับตัวแปร enteredDescription ยัดลงไป
            required: true,
            minLength: 1, 
            max: 500, // เพื่อกำหนดจำนวนสูงสุด
        }
        const peopleValidate: Validateable = { // สร้างตัวแปรเพื่อเก็บค่า input ไปตรวจสอบ
            value: enteredPeople,
            required: true,
            min: 1,
            max: 10,
        }

        // เอาตัวแปรด้านบนมา call function validate ถ้าอันใดอันนึงผิด
        if (!validate(titleValidate) || !validate(descriptionValidate) || !validate(peopleValidate)) {
            alert('invalid input please try again!!') // ให้มันแสดงข้อความเตือน
            return;
        }else{
            return [enteredTitle, enteredDescription, +enteredPeople]; // แสดงค่าของตัวแปรที่ผ่าน
        }
    }

    private clearInput () { // สร้าง Function เอาไว้เคลียร์ input
        this.titleInputElement.value = '';
        this.descriptionInputElement.value = '';
        this.peopleInputElement.value = '';
    }

    @autobind // สร้าง function ในการจัดการการกด add project
    private submitHandler (event: Event) {
        event.preventDefault();
        const userInput = this.getherUserInput();

        if (Array.isArray(userInput)) {
            const [title, desc, people] = userInput;
            projectState.addProject(title, desc, people);
            console.log(title,desc,people);
            this.clearInput();
        }
    }
}

const prjInput = new ProjectInput();
const activeProjectsList = new ProjectList('active');
const finishedProjectsList = new ProjectList('finished');